// T118-T119: 搜索引擎实现
use rusqlite::{Connection, Row};
use crate::database::models::Photo;
use crate::error::{PhotoManError, Result};
use super::{SearchQuery, SearchResult};
use super::builder::{QueryBuilder, build_count_query};

pub struct SearchEngine;

impl SearchEngine {
    /// T118: 执行搜索查询
    pub fn search(conn: &Connection, query: &SearchQuery) -> Result<SearchResult> {
        // 构建查询
        let (sql, params) = QueryBuilder::build_from_search_query(query);
        
        // 执行查询
        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| PhotoManError::database_error(format!("准备查询失败: {}", e)))?;

        let photos = stmt
            .query_map(rusqlite::params_from_iter(params.iter()), |row| {
                Self::map_row(row)
            })
            .map_err(|e| PhotoManError::database_error(format!("查询失败: {}", e)))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| PhotoManError::database_error(format!("读取结果失败: {}", e)))?;

        // 获取总数
        let total_count = Self::count(conn, query)?;
        
        let offset = query.offset.unwrap_or(0);
        let has_more = total_count > offset + photos.len() as i64;

        Ok(SearchResult {
            photos,
            total_count,
            has_more,
        })
    }

    /// 计算匹配条件的照片总数
    pub fn count(conn: &Connection, query: &SearchQuery) -> Result<i64> {
        let (sql, params) = build_count_query(query);
        
        let count: i64 = conn
            .query_row(&sql, rusqlite::params_from_iter(params.iter()), |row| {
                row.get(0)
            })
            .map_err(|e| PhotoManError::database_error(format!("计数查询失败: {}", e)))?;

        Ok(count)
    }

    /// T119 & T121: 快速搜索（使用全文搜索索引）
    pub fn quick_search(conn: &Connection, keyword: &str, limit: i64) -> Result<Vec<Photo>> {
        // T121: 优先使用 FTS5 全文搜索（性能更优）
        let fts_result = Self::fts_search(conn, keyword, limit);
        
        // 如果 FTS 搜索失败（可能迁移未执行），回退到 LIKE 搜索
        if fts_result.is_ok() {
            return fts_result;
        }
        
        log::warn!("FTS search failed, falling back to LIKE search");
        
        // 回退到传统 LIKE 搜索
        let pattern = format!("%{}%", keyword);
        let mut stmt = conn
            .prepare(
                "SELECT * FROM photos 
                 WHERE is_deleted = 0 AND file_name LIKE ?
                 ORDER BY first_scanned_at DESC
                 LIMIT ?",
            )
            .map_err(|e| PhotoManError::database_error(format!("准备查询失败: {}", e)))?;

        let photos = stmt
            .query_map(rusqlite::params![pattern, limit], |row| {
                Self::map_row(row)
            })
            .map_err(|e| PhotoManError::database_error(format!("查询失败: {}", e)))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| PhotoManError::database_error(format!("读取结果失败: {}", e)))?;

        Ok(photos)
    }
    
    /// T121: 使用 FTS5 全文搜索（高性能）
    fn fts_search(conn: &Connection, keyword: &str, limit: i64) -> Result<Vec<Photo>> {
        let mut stmt = conn
            .prepare(
                "SELECT p.* FROM photos p
                 INNER JOIN photos_fts fts ON p.id = fts.rowid
                 WHERE photos_fts MATCH ? AND p.is_deleted = 0
                 ORDER BY p.first_scanned_at DESC
                 LIMIT ?",
            )
            .map_err(|e| PhotoManError::database_error(format!("FTS 查询准备失败: {}", e)))?;

        let photos = stmt
            .query_map(rusqlite::params![keyword, limit], |row| {
                Self::map_row(row)
            })
            .map_err(|e| PhotoManError::database_error(format!("FTS 查询失败: {}", e)))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| PhotoManError::database_error(format!("读取 FTS 结果失败: {}", e)))?;

        Ok(photos)
    }

    /// 映射数据库行到Photo结构
    fn map_row(row: &Row) -> rusqlite::Result<Photo> {
        Ok(Photo {
            id: row.get(0)?,
            file_path: row.get(1)?,
            file_name: row.get(2)?,
            file_size: row.get(3)?,
            file_hash: row.get(4)?,
            width: row.get(5)?,
            height: row.get(6)?,
            format: row.get(7)?,
            title: row.get(8)?,
            description: row.get(9)?,
            rating: row.get(10)?,
            taken_at: row.get(11)?,
            camera_make: row.get(12)?,
            camera_model: row.get(13)?,
            lens_model: row.get(14)?,
            focal_length: row.get(15)?,
            aperture: row.get(16)?,
            shutter_speed: row.get(17)?,
            iso: row.get(18)?,
            gps_latitude: row.get(19)?,
            gps_longitude: row.get(20)?,
            gps_altitude: row.get(21)?,
            is_favorite: row.get(22)?,
            is_deleted: row.get(23)?,
            deleted_at: row.get(24)?,
            created_at: row.get(25)?,
            updated_at: row.get(26)?,
            first_scanned_at: row.get(27)?,
        })
    }
}

