// WatchedDirectory DAO - Data Access Object for watched directories
// T174-T177: 实现监控目录的 CRUD 操作和统计查询

use crate::database::models::WatchedDirectory;
use crate::error::{PhotoManError, Result};
use rusqlite::{params, Connection, OptionalExtension};

/// 创建新的监控目录
/// T175: Create operation
pub fn create(conn: &Connection, dir: &WatchedDirectory) -> Result<i64> {
    // 验证数据
    dir.validate()
        .map_err(|e| PhotoManError::validation_error(e))?;

    let mut stmt = conn
        .prepare(
            "INSERT INTO watched_directories 
            (directory_path, recursive, status, photo_count, error_message, created_at, last_synced_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        )
        .map_err(|e| PhotoManError::database_error(format!("准备插入语句失败: {}", e)))?;

    stmt.execute(params![
        dir.directory_path,
        dir.recursive,
        dir.status,
        dir.photo_count,
        dir.error_message,
        dir.created_at,
        dir.last_synced_at,
        dir.updated_at,
    ])
    .map_err(|e| {
        if e.to_string().contains("UNIQUE constraint failed") {
            PhotoManError::validation_error("该目录已经被监控".to_string())
        } else {
            PhotoManError::database_error(format!("插入监控目录失败: {}", e))
        }
    })?;

    let id = conn.last_insert_rowid();
    log::info!("创建监控目录: {} (ID: {})", dir.directory_path, id);
    Ok(id)
}

/// 根据 ID 查询监控目录
/// T175: Read operation
pub fn find_by_id(conn: &Connection, id: i64) -> Result<Option<WatchedDirectory>> {
    let mut stmt = conn
        .prepare(
            "SELECT id, directory_path, recursive, status, photo_count, error_message, 
                    created_at, last_synced_at, updated_at 
             FROM watched_directories WHERE id = ?1",
        )
        .map_err(|e| PhotoManError::database_error(format!("准备查询语句失败: {}", e)))?;

    let result = stmt
        .query_row(params![id], |row| {
            Ok(WatchedDirectory {
                id: Some(row.get(0)?),
                directory_path: row.get(1)?,
                recursive: row.get(2)?,
                status: row.get(3)?,
                photo_count: row.get(4)?,
                error_message: row.get(5)?,
                created_at: row.get(6)?,
                last_synced_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .optional()
        .map_err(|e| PhotoManError::database_error(format!("查询监控目录失败: {}", e)))?;

    Ok(result)
}

/// 根据路径查询监控目录
/// T175: Read operation
pub fn find_by_path(conn: &Connection, path: &str) -> Result<Option<WatchedDirectory>> {
    let mut stmt = conn
        .prepare(
            "SELECT id, directory_path, recursive, status, photo_count, error_message, 
                    created_at, last_synced_at, updated_at 
             FROM watched_directories WHERE directory_path = ?1",
        )
        .map_err(|e| PhotoManError::database_error(format!("准备查询语句失败: {}", e)))?;

    let result = stmt
        .query_row(params![path], |row| {
            Ok(WatchedDirectory {
                id: Some(row.get(0)?),
                directory_path: row.get(1)?,
                recursive: row.get(2)?,
                status: row.get(3)?,
                photo_count: row.get(4)?,
                error_message: row.get(5)?,
                created_at: row.get(6)?,
                last_synced_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .optional()
        .map_err(|e| PhotoManError::database_error(format!("查询监控目录失败: {}", e)))?;

    Ok(result)
}

/// 列出所有监控目录
/// T175: List operation
pub fn list_all(conn: &Connection) -> Result<Vec<WatchedDirectory>> {
    let mut stmt = conn
        .prepare(
            "SELECT id, directory_path, recursive, status, photo_count, error_message, 
                    created_at, last_synced_at, updated_at 
             FROM watched_directories 
             ORDER BY created_at DESC",
        )
        .map_err(|e| PhotoManError::database_error(format!("准备查询语句失败: {}", e)))?;

    let dirs = stmt
        .query_map([], |row| {
            Ok(WatchedDirectory {
                id: Some(row.get(0)?),
                directory_path: row.get(1)?,
                recursive: row.get(2)?,
                status: row.get(3)?,
                photo_count: row.get(4)?,
                error_message: row.get(5)?,
                created_at: row.get(6)?,
                last_synced_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|e| PhotoManError::database_error(format!("查询监控目录列表失败: {}", e)))?
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| PhotoManError::database_error(format!("读取查询结果失败: {}", e)))?;

    Ok(dirs)
}

/// 根据状态列出监控目录
/// T175: List operation with filter
pub fn list_by_status(conn: &Connection, status: &str) -> Result<Vec<WatchedDirectory>> {
    let mut stmt = conn
        .prepare(
            "SELECT id, directory_path, recursive, status, photo_count, error_message, 
                    created_at, last_synced_at, updated_at 
             FROM watched_directories 
             WHERE status = ?1
             ORDER BY created_at DESC",
        )
        .map_err(|e| PhotoManError::database_error(format!("准备查询语句失败: {}", e)))?;

    let dirs = stmt
        .query_map(params![status], |row| {
            Ok(WatchedDirectory {
                id: Some(row.get(0)?),
                directory_path: row.get(1)?,
                recursive: row.get(2)?,
                status: row.get(3)?,
                photo_count: row.get(4)?,
                error_message: row.get(5)?,
                created_at: row.get(6)?,
                last_synced_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|e| PhotoManError::database_error(format!("查询监控目录列表失败: {}", e)))?
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| PhotoManError::database_error(format!("读取查询结果失败: {}", e)))?;

    Ok(dirs)
}

/// 更新监控目录
/// T175: Update operation
pub fn update(conn: &Connection, dir: &WatchedDirectory) -> Result<()> {
    let id = dir
        .id
        .ok_or_else(|| PhotoManError::validation_error("监控目录 ID 不能为空".to_string()))?;

    // 验证数据
    dir.validate()
        .map_err(|e| PhotoManError::validation_error(e))?;

    let rows_affected = conn
        .execute(
            "UPDATE watched_directories 
             SET directory_path = ?1, recursive = ?2, status = ?3, photo_count = ?4, 
                 error_message = ?5, last_synced_at = ?6, updated_at = ?7
             WHERE id = ?8",
            params![
                dir.directory_path,
                dir.recursive,
                dir.status,
                dir.photo_count,
                dir.error_message,
                dir.last_synced_at,
                dir.updated_at,
                id,
            ],
        )
        .map_err(|e| PhotoManError::database_error(format!("更新监控目录失败: {}", e)))?;

    if rows_affected == 0 {
        return Err(PhotoManError::not_found_error(format!(
            "监控目录 ID {} 不存在",
            id
        )));
    }

    log::info!("更新监控目录: {} (ID: {})", dir.directory_path, id);
    Ok(())
}

/// 更新监控状态
/// T176: 实现监控状态更新
pub fn update_status(
    conn: &Connection,
    id: i64,
    status: &str,
    error_message: Option<String>,
) -> Result<()> {
    // 验证状态值
    let valid_statuses = ["active", "paused", "error"];
    if !valid_statuses.contains(&status) {
        return Err(PhotoManError::validation_error(format!(
            "无效的状态: {}",
            status
        )));
    }

    if status == "error" && error_message.is_none() {
        return Err(PhotoManError::validation_error(
            "错误状态必须提供错误消息".to_string(),
        ));
    }

    let now = chrono::Utc::now().to_rfc3339();
    let rows_affected = conn
        .execute(
            "UPDATE watched_directories 
             SET status = ?1, error_message = ?2, updated_at = ?3
             WHERE id = ?4",
            params![status, error_message, now, id],
        )
        .map_err(|e| PhotoManError::database_error(format!("更新监控状态失败: {}", e)))?;

    if rows_affected == 0 {
        return Err(PhotoManError::not_found_error(format!(
            "监控目录 ID {} 不存在",
            id
        )));
    }

    log::info!("更新监控目录 {} 状态为: {}", id, status);
    Ok(())
}

/// 更新图片数量
/// T176: 实现图片数量更新
pub fn update_photo_count(conn: &Connection, id: i64, count: i32) -> Result<()> {
    if count < 0 {
        return Err(PhotoManError::validation_error(
            "图片数量不能为负数".to_string(),
        ));
    }

    let now = chrono::Utc::now().to_rfc3339();
    let rows_affected = conn
        .execute(
            "UPDATE watched_directories 
             SET photo_count = ?1, updated_at = ?2
             WHERE id = ?3",
            params![count, now, id],
        )
        .map_err(|e| PhotoManError::database_error(format!("更新图片数量失败: {}", e)))?;

    if rows_affected == 0 {
        return Err(PhotoManError::not_found_error(format!(
            "监控目录 ID {} 不存在",
            id
        )));
    }

    log::debug!("更新监控目录 {} 的图片数量: {}", id, count);
    Ok(())
}

/// 标记已同步
/// T176: 实现同步时间更新
pub fn mark_synced(conn: &Connection, id: i64) -> Result<()> {
    let now = chrono::Utc::now().to_rfc3339();
    let rows_affected = conn
        .execute(
            "UPDATE watched_directories 
             SET last_synced_at = ?1, updated_at = ?2
             WHERE id = ?3",
            params![now.clone(), now, id],
        )
        .map_err(|e| PhotoManError::database_error(format!("更新同步时间失败: {}", e)))?;

    if rows_affected == 0 {
        return Err(PhotoManError::not_found_error(format!(
            "监控目录 ID {} 不存在",
            id
        )));
    }

    log::debug!("标记监控目录 {} 已同步", id);
    Ok(())
}

/// 删除监控目录
/// T175: Delete operation
pub fn delete(conn: &Connection, id: i64) -> Result<()> {
    let rows_affected = conn
        .execute("DELETE FROM watched_directories WHERE id = ?1", params![id])
        .map_err(|e| PhotoManError::database_error(format!("删除监控目录失败: {}", e)))?;

    if rows_affected == 0 {
        return Err(PhotoManError::not_found_error(format!(
            "监控目录 ID {} 不存在",
            id
        )));
    }

    log::info!("删除监控目录 ID: {}", id);
    Ok(())
}

/// 获取监控目录统计信息
/// T177: 实现统计信息查询
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct WatchedDirectoryStats {
    pub id: i64,
    pub directory_path: String,
    pub status: String,
    pub photo_count: i32,
    pub active_photos: i32,      // 未删除的图片数量
    pub deleted_photos: i32,      // 已删除的图片数量
    pub last_synced_at: Option<String>,
    pub scan_count: i32,          // 扫描次数
    pub last_scan_at: Option<String>,
}

pub fn get_stats(conn: &Connection, id: i64) -> Result<Option<WatchedDirectoryStats>> {
    let mut stmt = conn
        .prepare(
            "SELECT 
                wd.id,
                wd.directory_path,
                wd.status,
                wd.photo_count,
                wd.last_synced_at,
                COALESCE((SELECT COUNT(*) FROM photos WHERE watched_directory_id = wd.id AND is_deleted = 0), 0) as active_photos,
                COALESCE((SELECT COUNT(*) FROM photos WHERE watched_directory_id = wd.id AND is_deleted = 1), 0) as deleted_photos,
                COALESCE((SELECT COUNT(*) FROM scan_jobs WHERE watched_directory_id = wd.id), 0) as scan_count,
                COALESCE((SELECT MAX(started_at) FROM scan_jobs WHERE watched_directory_id = wd.id), NULL) as last_scan_at
             FROM watched_directories wd
             WHERE wd.id = ?1",
        )
        .map_err(|e| PhotoManError::database_error(format!("准备统计查询失败: {}", e)))?;

    let result = stmt
        .query_row(params![id], |row| {
            Ok(WatchedDirectoryStats {
                id: row.get(0)?,
                directory_path: row.get(1)?,
                status: row.get(2)?,
                photo_count: row.get(3)?,
                last_synced_at: row.get(4)?,
                active_photos: row.get(5)?,
                deleted_photos: row.get(6)?,
                scan_count: row.get(7)?,
                last_scan_at: row.get(8)?,
            })
        })
        .optional()
        .map_err(|e| PhotoManError::database_error(format!("查询统计信息失败: {}", e)))?;

    Ok(result)
}

/// 获取所有监控目录的统计信息
/// T177: 实现批量统计查询
pub fn get_all_stats(conn: &Connection) -> Result<Vec<WatchedDirectoryStats>> {
    let mut stmt = conn
        .prepare(
            "SELECT 
                wd.id,
                wd.directory_path,
                wd.status,
                wd.photo_count,
                wd.last_synced_at,
                COALESCE((SELECT COUNT(*) FROM photos WHERE watched_directory_id = wd.id AND is_deleted = 0), 0) as active_photos,
                COALESCE((SELECT COUNT(*) FROM photos WHERE watched_directory_id = wd.id AND is_deleted = 1), 0) as deleted_photos,
                COALESCE((SELECT COUNT(*) FROM scan_jobs WHERE watched_directory_id = wd.id), 0) as scan_count,
                COALESCE((SELECT MAX(started_at) FROM scan_jobs WHERE watched_directory_id = wd.id), NULL) as last_scan_at
             FROM watched_directories wd
             ORDER BY wd.created_at DESC",
        )
        .map_err(|e| PhotoManError::database_error(format!("准备统计查询失败: {}", e)))?;

    let stats = stmt
        .query_map([], |row| {
            Ok(WatchedDirectoryStats {
                id: row.get(0)?,
                directory_path: row.get(1)?,
                status: row.get(2)?,
                photo_count: row.get(3)?,
                last_synced_at: row.get(4)?,
                active_photos: row.get(5)?,
                deleted_photos: row.get(6)?,
                scan_count: row.get(7)?,
                last_scan_at: row.get(8)?,
            })
        })
        .map_err(|e| PhotoManError::database_error(format!("查询统计信息失败: {}", e)))?
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| PhotoManError::database_error(format!("读取统计结果失败: {}", e)))?;

    Ok(stats)
}

