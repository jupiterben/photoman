// 后台扫描服务
// 提供文件扫描和数据库更新功能

use super::{detector, hasher};
use crate::database::models::Photo;
use crate::error::{PhotoManError, Result};
use rusqlite::Connection;
use std::path::Path;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

/// 扫描服务
pub struct ScanService {
    db: Arc<Mutex<Connection>>,
}

impl ScanService {
    /// 创建新的扫描服务
    pub fn new(db: Arc<Mutex<Connection>>) -> Self {
        Self { db }
    }

    /// 扫描单个文件并添加到数据库
    pub fn scan_single_file(&self, file_path: &Path) -> Result<Option<i64>> {
        // 检查是否为图片文件
        if !detector::is_image_file(file_path) {
            return Ok(None);
        }

        log::info!("扫描文件: {:?}", file_path);

        // 获取文件元数据
        let metadata = std::fs::metadata(file_path)
            .map_err(|e| PhotoManError::invalid_path(format!("无法读取文件: {}", e)))?;

        let file_size = metadata.len();

        // 计算文件哈希
        let file_hash = hasher::calculate_file_hash(file_path)?;

        // 检查数据库中是否已存在（通过哈希值）
        let conn = self.db.lock().unwrap();
        let exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM photos WHERE file_hash = ?1 AND is_deleted = 0)",
                [&file_hash],
                |row| row.get(0),
            )
            .map_err(|e| PhotoManError::database_error(format!("查询失败: {}", e)))?;

        if exists {
            log::debug!("文件已存在（哈希重复）: {:?}", file_path);
            return Ok(None);
        }

        // 获取图片格式和尺寸
        let format = detector::get_image_format(file_path)
            .unwrap_or_else(|_| "unknown".to_string());
        
        let (width, height) = detector::get_image_dimensions(file_path)
            .ok()
            .unzip();

        // 创建 Photo 记录
        let file_name = file_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        let mut photo = Photo::new(
            file_path.to_string_lossy().to_string(),
            file_name,
            file_size as i64,
            file_hash,
            format,
        );

        photo.width = width.map(|w| w as i32);
        photo.height = height.map(|h| h as i32);

        // 插入数据库
        conn.execute(
            "INSERT INTO photos (
                file_path, file_name, file_size, file_hash, format,
                width, height, rating, is_favorite, is_deleted,
                created_at, updated_at, first_scanned_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            rusqlite::params![
                photo.file_path,
                photo.file_name,
                photo.file_size,
                photo.file_hash,
                photo.format,
                photo.width,
                photo.height,
                photo.rating,
                photo.is_favorite,
                photo.is_deleted,
                photo.created_at,
                photo.updated_at,
                photo.first_scanned_at,
            ],
        )
        .map_err(|e| PhotoManError::database_error(format!("插入照片失败: {}", e)))?;

        let photo_id = conn.last_insert_rowid();
        log::info!("成功添加照片 ID: {}", photo_id);

        Ok(Some(photo_id))
    }

    /// 扫描目录（递归）
    pub fn scan_directory(
        &self,
        dir_path: &Path,
        recursive: bool,
        app_handle: Option<&AppHandle>,
    ) -> Result<ScanStats> {
        log::info!("开始扫描目录: {:?} (递归: {})", dir_path, recursive);

        let mut stats = ScanStats::default();

        // 遍历目录
        self.scan_directory_internal(dir_path, recursive, &mut stats, app_handle)?;

        log::info!(
            "目录扫描完成: {:?}, 发现 {} 个文件，添加 {} 张照片，跳过 {} 个重复",
            dir_path,
            stats.total_files,
            stats.added_photos,
            stats.skipped_duplicates
        );

        Ok(stats)
    }

    /// 内部递归扫描方法
    fn scan_directory_internal(
        &self,
        dir_path: &Path,
        recursive: bool,
        stats: &mut ScanStats,
        app_handle: Option<&AppHandle>,
    ) -> Result<()> {
        let entries = std::fs::read_dir(dir_path)
            .map_err(|e| PhotoManError::invalid_path(format!("无法读取目录: {}", e)))?;

        for entry in entries {
            let entry = entry
                .map_err(|e| PhotoManError::invalid_path(format!("读取目录项失败: {}", e)))?;
            let path = entry.path();

            if path.is_file() {
                stats.total_files += 1;

                // 每处理 10 个文件发送一次进度
                if stats.total_files.rem_euclid(10) == 0 {
                    if let Some(handle) = app_handle {
                        Self::emit_scan_progress(handle, stats, &path);
                    }
                }

                // 扫描单个文件
                match self.scan_single_file(&path) {
                    Ok(Some(_)) => {
                        stats.added_photos += 1;
                    }
                    Ok(None) => {
                        stats.skipped_duplicates += 1;
                    }
                    Err(e) => {
                        log::error!("扫描文件失败 {:?}: {}", path, e);
                        stats.errors += 1;
                    }
                }
            } else if recursive && path.is_dir() {
                // 递归扫描子目录
                self.scan_directory_internal(&path, recursive, stats, app_handle)?;
            }
        }

        Ok(())
    }

    /// 处理文件删除
    pub fn handle_file_deleted(&self, file_path: &Path) -> Result<()> {
        log::info!("处理文件删除: {:?}", file_path);

        let conn = self.db.lock().unwrap();
        let path_str = file_path.to_string_lossy().to_string();

        // 软删除照片
        let affected = conn
            .execute(
                "UPDATE photos SET is_deleted = 1, updated_at = datetime('now') WHERE file_path = ?1",
                [&path_str],
            )
            .map_err(|e| PhotoManError::database_error(format!("删除照片失败: {}", e)))?;

        if affected > 0 {
            log::info!("已标记 {} 张照片为已删除", affected);
        }

        Ok(())
    }

    /// 处理文件修改
    pub fn handle_file_modified(&self, file_path: &Path) -> Result<()> {
        log::info!("处理文件修改: {:?}", file_path);

        // 重新计算哈希并更新
        if !detector::is_image_file(file_path) {
            return Ok(());
        }

        let file_hash = hasher::calculate_file_hash(file_path)?;
        let metadata = std::fs::metadata(file_path)
            .map_err(|e| PhotoManError::invalid_path(format!("无法读取文件: {}", e)))?;
        let file_size = metadata.len();

        let conn = self.db.lock().unwrap();
        let path_str = file_path.to_string_lossy().to_string();

        conn.execute(
            "UPDATE photos SET file_hash = ?1, file_size = ?2, updated_at = datetime('now') WHERE file_path = ?3",
            rusqlite::params![file_hash, file_size as i64, path_str],
        )
        .map_err(|e| PhotoManError::database_error(format!("更新照片失败: {}", e)))?;

        log::info!("已更新照片信息: {:?}", file_path);

        Ok(())
    }

    /// 处理文件重命名
    pub fn handle_file_renamed(&self, from: &Path, to: &Path) -> Result<()> {
        log::info!("处理文件重命名: {:?} -> {:?}", from, to);

        let conn = self.db.lock().unwrap();
        let from_str = from.to_string_lossy().to_string();
        let to_str = to.to_string_lossy().to_string();
        let new_name = to
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        conn.execute(
            "UPDATE photos SET file_path = ?1, file_name = ?2, updated_at = datetime('now') WHERE file_path = ?3",
            rusqlite::params![to_str, new_name, from_str],
        )
        .map_err(|e| PhotoManError::database_error(format!("重命名照片失败: {}", e)))?;

        log::info!("已更新照片路径: {:?} -> {:?}", from, to);

        Ok(())
    }

    /// 发送扫描进度事件
    fn emit_scan_progress(handle: &AppHandle, stats: &ScanStats, current_path: &Path) {
        let progress = serde_json::json!({
            "total_files": stats.total_files,
            "added_photos": stats.added_photos,
            "skipped_duplicates": stats.skipped_duplicates,
            "current_path": current_path.to_string_lossy(),
        });

        if let Err(e) = handle.emit("scan_progress", progress) {
            log::error!("发送扫描进度失败: {}", e);
        }
    }
}

/// 扫描统计信息
#[derive(Debug, Default, Clone, serde::Serialize)]
pub struct ScanStats {
    pub total_files: u32,
    pub added_photos: u32,
    pub skipped_duplicates: u32,
    pub errors: u32,
}

