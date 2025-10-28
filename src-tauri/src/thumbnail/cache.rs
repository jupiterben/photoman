// T065, T066: 实现缓存管理和LRU淘汰策略
use std::path::PathBuf;
use rusqlite::Connection;
use chrono::Utc;
use crate::error::{PhotoManError, Result};
use super::ThumbnailSize;

/// 缩略图缓存管理器
#[derive(Clone)]
pub struct ThumbnailCache {
    cache_dir: PathBuf,
    max_size_bytes: u64, // 最大缓存大小（字节）
}

impl ThumbnailCache {
    pub fn new(cache_dir: PathBuf, max_size_bytes: u64) -> Self {
        Self {
            cache_dir,
            max_size_bytes,
        }
    }
    
    /// 获取缓存路径
    pub fn get_cache_path(&self, photo_id: i64, size: ThumbnailSize) -> PathBuf {
        let size_dir = self.cache_dir.join(size.as_str());
        size_dir.join(format!("{}.jpg", photo_id))
    }
    
    /// 检查缓存是否存在
    pub fn exists(&self, photo_id: i64, size: ThumbnailSize) -> bool {
        self.get_cache_path(photo_id, size).exists()
    }
    
    /// 记录缓存到数据库
    pub fn record_cache(
        &self,
        conn: &Connection,
        photo_id: i64,
        size: ThumbnailSize,
        file_size: u64,
    ) -> Result<()> {
        let cache_path = self.get_cache_path(photo_id, size);
        let now = Utc::now().to_rfc3339();
        
        conn.execute(
            "INSERT OR REPLACE INTO thumbnail_cache 
             (photo_id, size_type, cache_path, file_size, generated_at, last_accessed_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                photo_id,
                size.as_str(),
                cache_path.to_string_lossy().to_string(),
                file_size as i64,
                now.clone(),
                now,
            ],
        )
        .map_err(|e| PhotoManError::database_error(format!("记录缓存失败: {}", e)))?;
        
        Ok(())
    }
    
    /// 更新最后访问时间
    pub fn touch_cache(&self, conn: &Connection, photo_id: i64, size: ThumbnailSize) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        
        conn.execute(
            "UPDATE thumbnail_cache SET last_accessed_at = ?1 
             WHERE photo_id = ?2 AND size_type = ?3",
            rusqlite::params![now, photo_id, size.as_str()],
        )
        .map_err(|e| PhotoManError::database_error(format!("更新访问时间失败: {}", e)))?;
        
        Ok(())
    }
    
    /// 获取当前缓存总大小
    pub fn get_total_size(&self, conn: &Connection) -> Result<u64> {
        let total: i64 = conn
            .query_row("SELECT COALESCE(SUM(file_size), 0) FROM thumbnail_cache", [], |row| {
                row.get(0)
            })
            .map_err(|e| PhotoManError::database_error(format!("查询缓存大小失败: {}", e)))?;
        
        Ok(total as u64)
    }
    
    /// 清理缓存（LRU策略）
    pub fn cleanup_lru(&self, conn: &Connection) -> Result<u64> {
        let total_size = self.get_total_size(conn)?;
        
        if total_size <= self.max_size_bytes {
            return Ok(0);
        }
        
        let target_size = (self.max_size_bytes as f64 * 0.8) as u64; // 清理到80%
        let to_free = total_size - target_size;
        
        // 获取最少使用的缓存（按最后访问时间排序）
        let mut stmt = conn
            .prepare(
                "SELECT id, photo_id, size_type, cache_path, file_size
                 FROM thumbnail_cache
                 ORDER BY last_accessed_at ASC",
            )
            .map_err(|e| PhotoManError::database_error(format!("查询缓存失败: {}", e)))?;
        
        let caches: Vec<(i64, i64, String, String, i64)> = stmt
            .query_map([], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?))
            })
            .map_err(|e| PhotoManError::database_error(format!("读取缓存记录失败: {}", e)))?
            .filter_map(|r| r.ok())
            .collect();
        
        let mut freed = 0u64;
        let mut deleted_ids = Vec::new();
        
        for (id, _photo_id, _size, cache_path, file_size) in caches {
            if freed >= to_free {
                break;
            }
            
            // 删除文件
            if let Err(e) = std::fs::remove_file(&cache_path) {
                eprintln!("删除缓存文件失败 {}: {}", cache_path, e);
            }
            
            freed += file_size as u64;
            deleted_ids.push(id);
        }
        
        // 从数据库删除记录
        for id in deleted_ids {
            conn.execute("DELETE FROM thumbnail_cache WHERE id = ?1", rusqlite::params![id])
                .ok();
        }
        
        Ok(freed)
    }
    
    /// 清空所有缓存
    pub fn clear_all(&self, conn: &Connection) -> Result<()> {
        // 删除所有文件
        if self.cache_dir.exists() {
            std::fs::remove_dir_all(&self.cache_dir)
                .map_err(|e| PhotoManError::io_error(format!("删除缓存目录失败: {}", e)))?;
        }
        
        // 清空数据库记录
        conn.execute("DELETE FROM thumbnail_cache", [])
            .map_err(|e| PhotoManError::database_error(format!("清空缓存记录失败: {}", e)))?;
        
        Ok(())
    }
}

