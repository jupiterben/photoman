// 照片管理命令
use std::sync::Arc;
use tauri::State;
use crate::database::models::Photo;
use crate::database::photos::PhotoDao;
use crate::error::Result;
use serde::Deserialize;

/// 照片更新请求
#[derive(Debug, Deserialize)]
pub struct UpdatePhotoRequest {
    pub id: i64,
    pub title: Option<String>,
    pub description: Option<String>,
    pub rating: Option<i32>,
    pub is_favorite: Option<bool>,
}

/// 获取照片列表
#[tauri::command]
pub async fn get_photos(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<Photo>> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        PhotoDao::get_all(&conn, limit, offset)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// 获取照片详情
#[tauri::command]
pub async fn get_photo_by_id(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    id: i64,
) -> Result<Option<Photo>> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        PhotoDao::get_by_id(&conn, id)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// 更新照片信息
#[tauri::command]
pub async fn update_photo(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    request: UpdatePhotoRequest,
) -> Result<()> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        // 先获取现有照片
        let mut photo = PhotoDao::get_by_id(&conn, request.id)?
            .ok_or_else(|| crate::error::PhotoManError::not_found_error("照片不存在"))?;
        
        // 更新字段
        if let Some(title) = request.title {
            photo.title = Some(title);
        }
        if let Some(description) = request.description {
            photo.description = Some(description);
        }
        if let Some(rating) = request.rating {
            if rating < 0 || rating > 5 {
                return Err(crate::error::PhotoManError::new(
                    crate::error::ErrorCode::InvalidInput,
                    "评分必须在0-5之间"
                ));
            }
            photo.rating = rating;
        }
        if let Some(is_favorite) = request.is_favorite {
            photo.is_favorite = is_favorite;
        }
        
        // 更新时间戳
        photo.updated_at = chrono::Utc::now().to_rfc3339();
        
        PhotoDao::update(&conn, &photo)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// 删除照片（软删除）
#[tauri::command]
pub async fn delete_photo(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    id: i64,
) -> Result<()> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        PhotoDao::soft_delete(&conn, id)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// 获取照片总数
#[tauri::command]
pub async fn get_photos_count(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    include_deleted: Option<bool>,
) -> Result<i64> {
    let db = Arc::clone(&db);
    let include_deleted = include_deleted.unwrap_or(false);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        PhotoDao::count(&conn, include_deleted)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

