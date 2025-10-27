// T062: 创建thumbnail模块
// 缩略图生成和缓存管理

pub mod generator;
pub mod cache;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum ThumbnailSize {
    Small,  // 200x200
    Medium, // 800x600
}

impl ThumbnailSize {
    pub fn dimensions(&self) -> (u32, u32) {
        match self {
            ThumbnailSize::Small => (200, 200),
            ThumbnailSize::Medium => (800, 600),
        }
    }
    
    pub fn as_str(&self) -> &'static str {
        match self {
            ThumbnailSize::Small => "small",
            ThumbnailSize::Medium => "medium",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThumbnailInfo {
    pub photo_id: i64,
    pub size_type: String,
    pub cache_path: PathBuf,
    pub file_size: u64,
}
