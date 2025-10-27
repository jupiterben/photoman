// T118: 搜索命令
use std::sync::Arc;
use tauri::State;
use crate::search::{SearchQuery, SearchResult};
use crate::search::engine::SearchEngine;
use crate::database::models::Photo;
use crate::error::Result;

/// 高级搜索
#[tauri::command]
pub async fn search_photos(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    query: SearchQuery,
) -> Result<SearchResult> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        SearchEngine::search(&conn, &query)
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

/// 快速搜索（仅文件名）
#[tauri::command]
pub async fn quick_search_photos(
    db: State<'_, Arc<std::sync::Mutex<rusqlite::Connection>>>,
    keyword: String,
    limit: Option<i64>,
) -> Result<Vec<Photo>> {
    let db = Arc::clone(&db);
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| {
            crate::error::PhotoManError::tauri_error(format!("获取数据库连接失败: {}", e))
        })?;
        
        SearchEngine::quick_search(&conn, &keyword, limit.unwrap_or(20))
    })
    .await
    .map_err(|e| crate::error::PhotoManError::tauri_error(format!("任务执行失败: {}", e)))?
}

