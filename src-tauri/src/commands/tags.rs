// T097-T101: 标签相关Tauri命令
use std::sync::Arc;
use tauri::State;
use crate::database::models::Tag;
use crate::database::tags::{TagDao, TagStats};
use crate::database::photo_tags::PhotoTagDao;
use crate::error::Result;

/// T097: 创建标签
#[tauri::command]
pub async fn create_tag(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    name: String,
    color: Option<String>,
) -> Result<i64> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        TagDao::create(&conn, &name, color.as_deref())
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// 获取所有标签
#[tauri::command]
pub async fn get_all_tags(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
) -> Result<Vec<Tag>> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        TagDao::find_all(&conn)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// T099: 搜索标签（用于自动补全）
#[tauri::command]
pub async fn search_tags(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    query: String,
    limit: Option<i64>,
) -> Result<Vec<Tag>> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        TagDao::search(&conn, &query, limit.unwrap_or(10))
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// 获取最常用标签
#[tauri::command]
pub async fn get_most_used_tags(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    limit: Option<i64>,
) -> Result<Vec<Tag>> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        TagDao::find_most_used(&conn, limit.unwrap_or(10))
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// T101: 更新标签
#[tauri::command]
pub async fn update_tag(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    id: i64,
    name: Option<String>,
    color: Option<String>,
) -> Result<()> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        TagDao::update(&conn, id, name.as_deref(), color.as_deref())
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// 删除标签
#[tauri::command]
pub async fn delete_tag(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    id: i64,
) -> Result<()> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        TagDao::delete(&conn, id)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// 获取标签统计信息
#[tauri::command]
pub async fn get_tag_stats(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
) -> Result<TagStats> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        TagDao::get_stats(&conn)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

// ===== 照片-标签关联操作 =====

/// T097: 为照片添加标签
#[tauri::command]
pub async fn add_tag_to_photo(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    photo_id: i64,
    tag_id: i64,
) -> Result<()> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        PhotoTagDao::add_tag_to_photo(&conn, photo_id, tag_id)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// 批量为照片添加标签
#[tauri::command]
pub async fn add_tag_to_photos(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    photo_ids: Vec<i64>,
    tag_id: i64,
) -> Result<i64> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        PhotoTagDao::add_tag_to_photos(&conn, &photo_ids, tag_id)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// T098: 从照片移除标签
#[tauri::command]
pub async fn remove_tag_from_photo(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    photo_id: i64,
    tag_id: i64,
) -> Result<()> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        PhotoTagDao::remove_tag_from_photo(&conn, photo_id, tag_id)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// 批量从照片移除标签
#[tauri::command]
pub async fn remove_tag_from_photos(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    photo_ids: Vec<i64>,
    tag_id: i64,
) -> Result<i64> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        PhotoTagDao::remove_tag_from_photos(&conn, &photo_ids, tag_id)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// 获取照片的所有标签
#[tauri::command]
pub async fn get_photo_tags(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    photo_id: i64,
) -> Result<Vec<Tag>> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        PhotoTagDao::get_tags_for_photo(&conn, photo_id)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// T100: 根据标签获取照片ID列表
#[tauri::command]
pub async fn get_photos_by_tag(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    tag_id: i64,
) -> Result<Vec<i64>> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        PhotoTagDao::get_photo_ids_by_tag(&conn, tag_id)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// 根据多个标签获取照片（OR逻辑）
#[tauri::command]
pub async fn get_photos_by_any_tags(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    tag_ids: Vec<i64>,
) -> Result<Vec<i64>> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        PhotoTagDao::get_photo_ids_by_any_tags(&conn, &tag_ids)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// 根据多个标签获取照片（AND逻辑）
#[tauri::command]
pub async fn get_photos_by_all_tags(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    tag_ids: Vec<i64>,
) -> Result<Vec<i64>> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        PhotoTagDao::get_photo_ids_by_all_tags(&conn, &tag_ids)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

