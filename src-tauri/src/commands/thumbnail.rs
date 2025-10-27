// T067: 实现generate_thumbnail Tauri命令
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Manager};
use crate::error::{PhotoManError, Result};
use crate::state::AppState;
use crate::thumbnail::{ThumbnailSize, ThumbnailInfo, generator, cache::ThumbnailCache};
use rusqlite;

/// 生成缩略图命令
#[tauri::command]
pub async fn generate_thumbnail(
    app: AppHandle,
    photo_id: i64,
    size: ThumbnailSize,
    state: tauri::State<'_, AppState>,
) -> Result<ThumbnailInfo> {
    // 获取照片信息
    let db = Arc::clone(&state.db);
    let (file_path, _): (String, String) = tokio::task::spawn_blocking(move || {
        let conn = db.lock().unwrap();
        conn.query_row(
            "SELECT file_path, file_name FROM photos WHERE id = ?1 AND is_deleted = 0",
            rusqlite::params![photo_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| PhotoManError::database_error(format!("照片不存在: {}", e)))
    })
    .await
    .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
    
    // 获取缓存目录
    let app_dir = app.path().app_data_dir()
        .map_err(|e| PhotoManError::tauri_error(format!("无法获取应用目录: {}", e)))?;
    let cache_dir = app_dir.join("thumbnails");
    
    let cache = ThumbnailCache::new(cache_dir, 5 * 1024 * 1024 * 1024); // 5GB
    
    // 检查缓存是否存在
    if cache.exists(photo_id, size) {
        let db = Arc::clone(&state.db);
        let cache_clone = cache.clone();
        tokio::task::spawn_blocking(move || {
            let conn = db.lock().unwrap();
            cache_clone.touch_cache(&conn, photo_id, size)
        })
        .await
        .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
        
        let cache_path = cache.get_cache_path(photo_id, size);
        let metadata = std::fs::metadata(&cache_path)
            .map_err(|e| PhotoManError::io_error(format!("读取缓存文件失败: {}", e)))?;
        
        return Ok(ThumbnailInfo {
            photo_id,
            size_type: size.as_str().to_string(),
            cache_path,
            file_size: metadata.len(),
        });
    }
    
    // 生成缩略图
    let source_path = PathBuf::from(&file_path);
    let output_path = cache.get_cache_path(photo_id, size);
    
    let file_size = tokio::task::spawn_blocking(move || {
        generator::generate_thumbnail(&source_path, &output_path, size)
    })
    .await
    .map_err(|e| PhotoManError::tauri_error(format!("生成缩略图任务失败: {}", e)))??;
    
    // 记录到数据库
    let db = Arc::clone(&state.db);
    let cache_clone = cache.clone();
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().unwrap();
        cache_clone.record_cache(&conn, photo_id, size, file_size)
    })
    .await
    .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
    
    Ok(ThumbnailInfo {
        photo_id,
        size_type: size.as_str().to_string(),
        cache_path: cache.get_cache_path(photo_id, size),
        file_size,
    })
}

/// 批量生成缩略图
#[tauri::command]
pub async fn generate_thumbnails_batch(
    app: AppHandle,
    photo_ids: Vec<i64>,
    size: ThumbnailSize,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<ThumbnailInfo>> {
    let mut results = Vec::new();
    
    for photo_id in photo_ids {
        match generate_thumbnail(app.clone(), photo_id, size, state.clone()).await {
            Ok(info) => results.push(info),
            Err(e) => {
                eprintln!("生成缩略图失败 photo_id={}: {}", photo_id, e);
            }
        }
    }
    
    Ok(results)
}

/// 清理缓存
#[tauri::command]
pub async fn cleanup_thumbnail_cache(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<u64> {
    let app_dir = app.path().app_data_dir()
        .map_err(|e| PhotoManError::tauri_error(format!("无法获取应用目录: {}", e)))?;
    let cache_dir = app_dir.join("thumbnails");
    
    let cache = ThumbnailCache::new(cache_dir, 5 * 1024 * 1024 * 1024);
    
    let db = Arc::clone(&state.db);
    let freed = tokio::task::spawn_blocking(move || {
        let conn = db.lock().unwrap();
        cache.cleanup_lru(&conn)
    })
    .await
    .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
    
    Ok(freed)
}

/// 获取缓存大小
#[tauri::command]
pub async fn get_thumbnail_cache_size(
    state: tauri::State<'_, AppState>,
) -> Result<u64> {
    let db = Arc::clone(&state.db);
    let total: i64 = tokio::task::spawn_blocking(move || {
        let conn = db.lock().unwrap();
        conn.query_row(
            "SELECT COALESCE(SUM(file_size), 0) FROM thumbnail_cache",
            [],
            |row| row.get(0),
        )
        .map_err(|e| PhotoManError::database_error(format!("查询缓存大小失败: {}", e)))
    })
    .await
    .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
    
    Ok(total as u64)
}

