// Watcher commands for Tauri
// T186-T193: 实现监控目录管理命令

use crate::database::models::WatchedDirectory;
use crate::database::watched_directories;
use crate::error::{AppError, Result};
use crate::state::AppState;
use crate::watcher::WatcherStatus;
use std::path::PathBuf;
use tauri::State;

/// 添加监控目录命令
/// T186: add_watched_directory
#[tauri::command]
pub async fn add_watched_directory(
    directory_path: String,
    recursive: bool,
    state: State<'_, AppState>,
) -> Result<i64> {
    log::info!("添加监控目录: {} (递归: {})", directory_path, recursive);

    // 验证路径是否存在
    let path = PathBuf::from(&directory_path);
    if !path.exists() {
        return Err(AppError::invalid_path(format!(
            "目录不存在: {}",
            directory_path
        )));
    }

    if !path.is_dir() {
        return Err(AppError::invalid_path(format!(
            "路径不是目录: {}",
            directory_path
        )));
    }

    // 创建监控目录记录
    let mut watched_dir = WatchedDirectory::new(directory_path.clone(), recursive);
    
    let conn = state.db.lock().unwrap();
    
    // 检查是否已存在
    if let Some(existing) = watched_directories::find_by_path(&conn, &directory_path)? {
        return Err(AppError::validation_error(format!(
            "目录已被监控 (ID: {})",
            existing.id.unwrap_or(0)
        )));
    }

    // 插入数据库
    let id = watched_directories::create(&conn, &watched_dir)?;
    watched_dir.id = Some(id);

    // 添加到监控管理器
    if let Some(manager) = &state.watcher_manager {
        let manager = manager.lock().unwrap();
        if let Err(e) = manager.add_watch(id, path, recursive) {
            log::error!("添加监控失败: {}", e);
            // 更新状态为错误
            let _ = watched_directories::update_status(&conn, id, "error", Some(e.to_string()));
            return Err(AppError::new(
                crate::error::ErrorCode::InternalError,
                format!("添加监控失败: {}", e),
            ));
        }
    }

    // 标记已同步
    watched_directories::mark_synced(&conn, id)?;

    log::info!("成功添加监控目录 ID: {}", id);
    Ok(id)
}

/// 移除监控目录命令
/// T187: remove_watched_directory
#[tauri::command]
pub async fn remove_watched_directory(
    directory_id: i64,
    state: State<'_, AppState>,
) -> Result<()> {
    log::info!("移除监控目录 ID: {}", directory_id);

    let conn = state.db.lock().unwrap();

    // 检查是否存在
    let dir = watched_directories::find_by_id(&conn, directory_id)?
        .ok_or_else(|| AppError::not_found_error(format!("监控目录不存在: {}", directory_id)))?;

    // 从监控管理器移除
    if let Some(manager) = &state.watcher_manager {
        let manager = manager.lock().unwrap();
        if let Err(e) = manager.remove_watch(directory_id) {
            log::error!("从监控管理器移除失败: {}", e);
        }
    }

    // 从数据库删除
    watched_directories::delete(&conn, directory_id)?;

    log::info!("成功移除监控目录: {:?}", dir.directory_path);
    Ok(())
}

/// 暂停监控目录命令
/// T188: pause_watched_directory
#[tauri::command]
pub async fn pause_watched_directory(
    directory_id: i64,
    state: State<'_, AppState>,
) -> Result<()> {
    log::info!("暂停监控目录 ID: {}", directory_id);

    let conn = state.db.lock().unwrap();

    // 检查是否存在
    watched_directories::find_by_id(&conn, directory_id)?
        .ok_or_else(|| AppError::not_found_error(format!("监控目录不存在: {}", directory_id)))?;

    // 更新状态
    watched_directories::update_status(&conn, directory_id, "paused", None)?;

    // 暂停监控管理器
    if let Some(manager) = &state.watcher_manager {
        let manager = manager.lock().unwrap();
        manager.pause_watch(directory_id).map_err(|e| {
            AppError::new(
                crate::error::ErrorCode::InternalError,
                format!("暂停监控失败: {}", e),
            )
        })?;
    }

    log::info!("成功暂停监控目录 ID: {}", directory_id);
    Ok(())
}

/// 恢复监控目录命令
/// T189: resume_watched_directory
#[tauri::command]
pub async fn resume_watched_directory(
    directory_id: i64,
    state: State<'_, AppState>,
) -> Result<()> {
    log::info!("恢复监控目录 ID: {}", directory_id);

    let conn = state.db.lock().unwrap();

    // 检查是否存在
    watched_directories::find_by_id(&conn, directory_id)?
        .ok_or_else(|| AppError::not_found_error(format!("监控目录不存在: {}", directory_id)))?;

    // 更新状态
    watched_directories::update_status(&conn, directory_id, "active", None)?;

    // 恢复监控管理器
    if let Some(manager) = &state.watcher_manager {
        let manager = manager.lock().unwrap();
        manager.resume_watch(directory_id).map_err(|e| {
            AppError::new(
                crate::error::ErrorCode::InternalError,
                format!("恢复监控失败: {}", e),
            )
        })?;
    }

    log::info!("成功恢复监控目录 ID: {}", directory_id);
    Ok(())
}

/// 获取所有监控目录命令
/// T190: get_watched_directories
#[tauri::command]
pub async fn get_watched_directories(
    state: State<'_, AppState>,
) -> Result<Vec<WatchedDirectory>> {
    log::debug!("获取所有监控目录");

    let conn = state.db.lock().unwrap();
    let dirs = watched_directories::list_all(&conn)?;

    log::debug!("返回 {} 个监控目录", dirs.len());
    Ok(dirs)
}

/// 获取监控目录统计信息命令
/// T191: get_watched_directory_stats
#[tauri::command]
pub async fn get_watched_directory_stats(
    directory_id: i64,
    state: State<'_, AppState>,
) -> Result<watched_directories::WatchedDirectoryStats> {
    log::debug!("获取监控目录统计 ID: {}", directory_id);

    let conn = state.db.lock().unwrap();
    let stats = watched_directories::get_stats(&conn, directory_id)?
        .ok_or_else(|| AppError::not_found_error(format!("监控目录不存在: {}", directory_id)))?;

    Ok(stats)
}

/// 获取所有监控目录统计信息命令
#[tauri::command]
pub async fn get_all_watched_directory_stats(
    state: State<'_, AppState>,
) -> Result<Vec<watched_directories::WatchedDirectoryStats>> {
    log::debug!("获取所有监控目录统计");

    let conn = state.db.lock().unwrap();
    let stats = watched_directories::get_all_stats(&conn)?;

    log::debug!("返回 {} 个监控目录统计", stats.len());
    Ok(stats)
}

/// 重新扫描监控目录命令
/// T192: rescan_watched_directory
#[tauri::command]
pub async fn rescan_watched_directory(
    directory_id: i64,
    state: State<'_, AppState>,
) -> Result<()> {
    log::info!("重新扫描监控目录 ID: {}", directory_id);

    let conn = state.db.lock().unwrap();

    // 检查是否存在
    let dir = watched_directories::find_by_id(&conn, directory_id)?
        .ok_or_else(|| AppError::not_found_error(format!("监控目录不存在: {}", directory_id)))?;

    // TODO: T203 - 触发重新扫描
    // 这里将在 T203 中集成到扫描命令
    log::info!("触发重新扫描: {:?}", dir.directory_path);

    Ok(())
}

/// 获取监控器运行状态
#[tauri::command]
pub async fn get_watcher_status(
    state: State<'_, AppState>,
) -> Result<Vec<(i64, String, WatcherStatus)>> {
    log::debug!("获取监控器运行状态");

    if let Some(manager) = &state.watcher_manager {
        let manager = manager.lock().unwrap();
        let statuses = manager
            .get_watched_directories()
            .into_iter()
            .map(|(id, path, status)| (id, path.to_string_lossy().to_string(), status))
            .collect();
        Ok(statuses)
    } else {
        Ok(Vec::new())
    }
}

