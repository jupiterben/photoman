// T133-T136: 回收站命令实现
use std::sync::Arc;
use tauri::State;
use crate::error::{PhotoManError, Result};
use crate::state::AppState;
use crate::database::models::Photo;
use rusqlite;

/// T133: 软删除照片（移至回收站）
#[tauri::command]
pub async fn soft_delete_photos(
    photo_ids: Vec<i64>,
    state: State<'_, AppState>,
) -> Result<usize> {
    let db = Arc::clone(&state.db);
    
    let count = tokio::task::spawn_blocking(move || {
        let conn = db.lock().unwrap();
        
        let mut deleted = 0;
        for photo_id in photo_ids {
            let result = conn.execute(
                "UPDATE photos 
                 SET is_deleted = 1, deleted_at = datetime('now'), updated_at = datetime('now')
                 WHERE id = ? AND is_deleted = 0",
                rusqlite::params![photo_id],
            );
            
            if let Ok(changed) = result {
                deleted += changed;
            }
        }
        
        Ok::<_, PhotoManError>(deleted)
    })
    .await
    .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
    
    log::info!("软删除 {} 张照片", count);
    Ok(count)
}

/// T134: 恢复照片（从回收站恢复）
#[tauri::command]
pub async fn restore_photos(
    photo_ids: Vec<i64>,
    state: State<'_, AppState>,
) -> Result<usize> {
    let db = Arc::clone(&state.db);
    
    let count = tokio::task::spawn_blocking(move || {
        let conn = db.lock().unwrap();
        
        let mut restored = 0;
        for photo_id in photo_ids {
            let result = conn.execute(
                "UPDATE photos 
                 SET is_deleted = 0, deleted_at = NULL, updated_at = datetime('now')
                 WHERE id = ? AND is_deleted = 1",
                rusqlite::params![photo_id],
            );
            
            if let Ok(changed) = result {
                restored += changed;
            }
        }
        
        Ok::<_, PhotoManError>(restored)
    })
    .await
    .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
    
    log::info!("恢复 {} 张照片", count);
    Ok(count)
}

/// T135: 永久删除照片（从回收站彻底删除）
#[tauri::command]
pub async fn permanently_delete_photos(
    photo_ids: Vec<i64>,
    state: State<'_, AppState>,
) -> Result<usize> {
    let db = Arc::clone(&state.db);
    
    let count = tokio::task::spawn_blocking(move || {
        let conn = db.lock().unwrap();
        
        let mut deleted = 0;
        for photo_id in photo_ids {
            // 先删除关联的缩略图缓存
            conn.execute(
                "DELETE FROM thumbnail_cache WHERE photo_id = ?",
                rusqlite::params![photo_id],
            )?;
            
            // 删除照片记录（级联删除 photo_tags 和 album_photos）
            let result = conn.execute(
                "DELETE FROM photos WHERE id = ? AND is_deleted = 1",
                rusqlite::params![photo_id],
            );
            
            if let Ok(changed) = result {
                deleted += changed;
            }
        }
        
        Ok::<_, PhotoManError>(deleted)
    })
    .await
    .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
    
    log::info!("永久删除 {} 张照片", count);
    Ok(count)
}

/// T137: 获取回收站中的照片
#[tauri::command]
pub async fn get_recycle_bin_photos(
    state: State<'_, AppState>,
) -> Result<Vec<Photo>> {
    let db = Arc::clone(&state.db);
    
    let photos = tokio::task::spawn_blocking(move || {
        let conn = db.lock().unwrap();
        
        let mut stmt = conn
            .prepare(
                "SELECT * FROM photos 
                 WHERE is_deleted = 1 
                 ORDER BY deleted_at DESC",
            )
            .map_err(|e| PhotoManError::database_error(format!("准备查询失败: {}", e)))?;
        
        let photos = stmt
            .query_map([], |row| {
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
            })
            .map_err(|e| PhotoManError::database_error(format!("查询失败: {}", e)))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| PhotoManError::database_error(format!("读取结果失败: {}", e)))?;
        
        Ok::<_, PhotoManError>(photos)
    })
    .await
    .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
    
    Ok(photos)
}

/// T136: 清理过期的回收站项目（30天前的）
#[tauri::command]
pub async fn clean_expired_recycle_bin(
    days: i64,
    state: State<'_, AppState>,
) -> Result<usize> {
    let db = Arc::clone(&state.db);
    
    let count = tokio::task::spawn_blocking(move || {
        let conn = db.lock().unwrap();
        
        // 获取过期的照片 ID
        let mut stmt = conn
            .prepare(
                "SELECT id FROM photos 
                 WHERE is_deleted = 1 
                 AND deleted_at < datetime('now', ?)",
            )
            .map_err(|e| PhotoManError::database_error(format!("准备查询失败: {}", e)))?;
        
        let days_param = format!("-{} days", days);
        let expired_ids: Vec<i64> = stmt
            .query_map(rusqlite::params![days_param], |row| row.get(0))
            .map_err(|e| PhotoManError::database_error(format!("查询失败: {}", e)))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| PhotoManError::database_error(format!("读取结果失败: {}", e)))?;
        
        let count = expired_ids.len();
        
        // 永久删除过期照片
        for photo_id in expired_ids {
            conn.execute(
                "DELETE FROM thumbnail_cache WHERE photo_id = ?",
                rusqlite::params![photo_id],
            )?;
            
            conn.execute(
                "DELETE FROM photos WHERE id = ?",
                rusqlite::params![photo_id],
            )?;
        }
        
        Ok::<_, PhotoManError>(count)
    })
    .await
    .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
    
    log::info!("清理 {} 张过期照片", count);
    Ok(count)
}

/// 清空整个回收站
#[tauri::command]
pub async fn empty_recycle_bin(
    state: State<'_, AppState>,
) -> Result<usize> {
    let db = Arc::clone(&state.db);
    
    let count = tokio::task::spawn_blocking(move || {
        let conn = db.lock().unwrap();
        
        // 获取所有已删除的照片 ID
        let mut stmt = conn
            .prepare("SELECT id FROM photos WHERE is_deleted = 1")
            .map_err(|e| PhotoManError::database_error(format!("准备查询失败: {}", e)))?;
        
        let photo_ids: Vec<i64> = stmt
            .query_map([], |row| row.get(0))
            .map_err(|e| PhotoManError::database_error(format!("查询失败: {}", e)))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| PhotoManError::database_error(format!("读取结果失败: {}", e)))?;
        
        let count = photo_ids.len();
        
        // 删除缩略图缓存
        conn.execute(
            "DELETE FROM thumbnail_cache WHERE photo_id IN (SELECT id FROM photos WHERE is_deleted = 1)",
            [],
        )?;
        
        // 永久删除所有已删除的照片
        conn.execute("DELETE FROM photos WHERE is_deleted = 1", [])?;
        
        Ok::<_, PhotoManError>(count)
    })
    .await
    .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
    
    log::info!("清空回收站，删除 {} 张照片", count);
    Ok(count)
}

/// 获取回收站统计信息
#[tauri::command]
pub async fn get_recycle_bin_stats(
    state: State<'_, AppState>,
) -> Result<RecycleBinStats> {
    let db = Arc::clone(&state.db);
    
    let stats = tokio::task::spawn_blocking(move || {
        let conn = db.lock().unwrap();
        
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM photos WHERE is_deleted = 1",
                [],
                |row| row.get(0),
            )
            .map_err(|e| PhotoManError::database_error(format!("查询失败: {}", e)))?;
        
        let total_size: i64 = conn
            .query_row(
                "SELECT COALESCE(SUM(file_size), 0) FROM photos WHERE is_deleted = 1",
                [],
                |row| row.get(0),
            )
            .map_err(|e| PhotoManError::database_error(format!("查询失败: {}", e)))?;
        
        let oldest_deleted: Option<String> = conn
            .query_row(
                "SELECT MIN(deleted_at) FROM photos WHERE is_deleted = 1",
                [],
                |row| row.get(0),
            )
            .ok();
        
        Ok::<_, PhotoManError>(RecycleBinStats {
            count: count as u32,
            total_size,
            oldest_deleted,
        })
    })
    .await
    .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
    
    Ok(stats)
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct RecycleBinStats {
    pub count: u32,
    pub total_size: i64,
    pub oldest_deleted: Option<String>,
}

