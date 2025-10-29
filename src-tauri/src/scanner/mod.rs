// T049: 创建scanner模块
// 图片扫描核心模块

pub mod walker;
pub mod detector;
pub mod hasher;
pub mod dedup;
pub mod service;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// 扫描结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub total_files: u32,
    pub found_photos: u32,
    pub duplicates_skipped: u32,
    pub photos: Vec<ScannedPhoto>,
}

/// 扫描到的图片信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScannedPhoto {
    pub file_path: PathBuf,
    pub file_name: String,
    pub file_size: u64,
    pub file_hash: String,
    pub format: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

/// 扫描进度事件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub total_files: u32,
    pub processed_files: u32,
    pub found_photos: u32,
    pub current_path: String,
}

impl ScanResult {
    pub fn new() -> Self {
        Self {
            total_files: 0,
            found_photos: 0,
            duplicates_skipped: 0,
            photos: Vec::new(),
        }
    }
}

impl Default for ScanResult {
    fn default() -> Self {
        Self::new()
    }
}
