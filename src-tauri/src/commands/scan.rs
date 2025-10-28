// T055, T062: 实现scan_folder Tauri命令
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use serde::{Deserialize, Serialize};
use crate::error::{PhotoManError, Result};
use crate::scanner::{ScanResult, ScanProgress, ScannedPhoto};
use crate::scanner::{walker, detector, hasher, dedup};
use crate::state::AppState;
use crate::database::models::Photo;
use rusqlite;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanOptions {
    pub recursive: bool,
    pub detect_duplicates: bool,
}

/// 扫描文件夹命令
#[tauri::command]
pub async fn scan_folder(
    app: AppHandle,
    path: String,
    options: ScanOptions,
    state: tauri::State<'_, AppState>,
) -> Result<ScanResult> {
    let target_path = PathBuf::from(&path);
    
    if !target_path.exists() {
        return Err(PhotoManError::invalid_path(format!("路径不存在: {}", path)));
    }
    
    if !target_path.is_dir() {
        return Err(PhotoManError::invalid_path(format!("不是有效的文件夹: {}", path)));
    }
    
    // 创建扫描任务记录
    let db = Arc::clone(&state.db);
    let path_clone = path.clone();
    let scan_job_id = tokio::task::spawn_blocking(move || {
        let conn = db.lock().unwrap();
        conn.execute(
            "INSERT INTO scan_jobs (target_path, status, started_at) VALUES (?1, ?2, datetime('now'))",
            rusqlite::params![path_clone, "running"],
        )
        .map_err(|e| PhotoManError::database_error(format!("创建扫描任务失败: {}", e)))
    })
    .await
    .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
    
    let mut result = ScanResult::new();
    
    // 1. 遍历文件
    emit_progress(&app, 0, 0, 0, "开始扫描...").ok();
    
    let files = walker::walk_directory(&target_path, options.recursive)?;
    result.total_files = files.len() as u32;
    
    // 2. 筛选图片文件
    log::info!("开始筛选图片文件，总文件数: {}", files.len());
    
    let image_files: Vec<_> = files
        .iter()
        .filter(|f| detector::is_image_file(f))
        .collect();
    
    log::info!("筛选完成，发现图片: {}/{}", image_files.len(), files.len());
    
    // 3. 准备重复检测
    let mut dup_detector = dedup::DuplicateDetector::new();
    
    if options.detect_duplicates {
        // 从数据库加载已有的哈希值
        let db = Arc::clone(&state.db);
        let existing_hashes = tokio::task::spawn_blocking(move || {
            let conn = db.lock().unwrap();
            let mut stmt = conn
                .prepare("SELECT file_hash, file_path FROM photos WHERE is_deleted = 0")
                .map_err(|e| PhotoManError::database_error(e.to_string()))?;
            
            let hashes: Vec<(String, String)> = stmt
                .query_map([], |row| {
                    Ok((row.get(0)?, row.get(1)?))
                })
                .map_err(|e| PhotoManError::database_error(e.to_string()))?
                .filter_map(|r| r.ok())
                .collect();
            
            Ok::<_, PhotoManError>(hashes)
        })
        .await
        .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
        
        dup_detector.load_existing_hashes(existing_hashes);
    }
    
    // 4. 处理每个图片文件
    let mut scanned_photos = Vec::new();
    
    for (idx, file_path) in image_files.iter().enumerate() {
        let processed = idx as u32 + 1;
        
        // 发送进度
        if processed % 10 == 0 || processed == image_files.len() as u32 {
            emit_progress(
                &app,
                result.total_files,
                processed,
                scanned_photos.len() as u32,
                &file_path.to_string_lossy(),
            ).ok();
        }
        
        // 获取文件信息
        let metadata = match std::fs::metadata(file_path) {
            Ok(m) => m,
            Err(e) => {
                eprintln!("无法读取文件元数据 {:?}: {}", file_path, e);
                continue;
            }
        };
        
        let file_size = metadata.len();
        
        // 计算哈希
        let file_hash = match hasher::calculate_file_hash(file_path) {
            Ok(h) => h,
            Err(e) => {
                eprintln!("无法计算文件哈希 {:?}: {}", file_path, e);
                continue;
            }
        };
        
        // 检查重复
        if options.detect_duplicates {
            let (is_dup, _) = dup_detector.check_duplicate(&file_hash);
            if is_dup {
                result.duplicates_skipped += 1;
                continue;
            }
            dup_detector.add_hash(file_hash.clone(), file_path.to_string_lossy().to_string());
        }
        
        // 获取图片格式和尺寸
        let format = match detector::get_image_format(file_path) {
            Ok(f) => f,
            Err(_) => continue,
        };
        
        let (width, height) = detector::get_image_dimensions(file_path).ok().unzip();
        
        scanned_photos.push(ScannedPhoto {
            file_path: file_path.to_path_buf(),
            file_name: file_path.file_name().unwrap().to_string_lossy().to_string(),
            file_size,
            file_hash,
            format,
            width,
            height,
        });
    }
    
    result.found_photos = scanned_photos.len() as u32;
    result.photos = scanned_photos.clone();
    
    // 5. 保存到数据库
    let db = Arc::clone(&state.db);
    let photos_for_db = scanned_photos.clone();
    let total_files = result.total_files;
    let image_count = image_files.len() as u32;
    let found = result.found_photos;
    let dups = result.duplicates_skipped;
    
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().unwrap();
        
        for photo in photos_for_db {
            let mut new_photo = Photo::new(
                photo.file_path.to_string_lossy().to_string(),
                photo.file_name,
                photo.file_size as i64,
                photo.file_hash,
                photo.format,
            );
            
            new_photo.width = photo.width.map(|w| w as i32);
            new_photo.height = photo.height.map(|h| h as i32);
            
            // 插入数据库（忽略重复）
            conn.execute(
                "INSERT OR IGNORE INTO photos (
                    file_path, file_name, file_size, file_hash, format,
                    width, height, rating, is_favorite, is_deleted,
                    created_at, updated_at, first_scanned_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                rusqlite::params![
                    new_photo.file_path,
                    new_photo.file_name,
                    new_photo.file_size,
                    new_photo.file_hash,
                    new_photo.format,
                    new_photo.width,
                    new_photo.height,
                    new_photo.rating,
                    new_photo.is_favorite,
                    new_photo.is_deleted,
                    new_photo.created_at,
                    new_photo.updated_at,
                    new_photo.first_scanned_at,
                ],
            )
            .map_err(|e| PhotoManError::database_error(format!("插入照片失败: {}", e)))?;
        }
        
        // 更新扫描任务状态
        conn.execute(
            "UPDATE scan_jobs SET 
                status = ?1,
                total_files = ?2,
                processed_files = ?3,
                found_photos = ?4,
                duplicates_skipped = ?5,
                finished_at = datetime('now')
             WHERE id = ?6",
            rusqlite::params![
                "completed",
                total_files,
                image_count,
                found,
                dups,
                scan_job_id,
            ],
        )
        .map_err(|e| PhotoManError::database_error(format!("更新扫描任务失败: {}", e)))?;
        
        Ok::<_, PhotoManError>(())
    })
    .await
    .map_err(|e| PhotoManError::tauri_error(format!("任务执行失败: {}", e)))??;
    
    // 发送完成事件
    emit_progress(
        &app,
        result.total_files,
        image_files.len() as u32,
        result.found_photos,
        "扫描完成",
    ).ok();
    
    Ok(result)
}

/// 发送扫描进度事件
fn emit_progress(
    app: &AppHandle,
    total: u32,
    processed: u32,
    found: u32,
    current_path: &str,
) -> Result<()> {
    let progress = ScanProgress {
        total_files: total,
        processed_files: processed,
        found_photos: found,
        current_path: current_path.to_string(),
    };
    
    app.emit("scan_progress", progress)
        .map_err(|e| PhotoManError::tauri_error(format!("发送进度事件失败: {}", e)))?;
    
    Ok(())
}

