// T116: 搜索模块
use serde::{Deserialize, Serialize};
use crate::database::models::Photo;

/// 搜索查询参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQuery {
    /// 全文搜索关键词
    pub keyword: Option<String>,
    
    /// 标签ID筛选（OR逻辑）
    pub tag_ids: Option<Vec<i64>>,
    
    /// 标签筛选模式
    pub tag_mode: Option<TagFilterMode>,
    
    /// 日期范围筛选
    pub date_from: Option<i64>,
    pub date_to: Option<i64>,
    
    /// 文件大小筛选（字节）
    pub size_min: Option<i64>,
    pub size_max: Option<i64>,
    
    /// 文件格式筛选
    pub formats: Option<Vec<String>>,
    
    /// 宽度筛选
    pub width_min: Option<i32>,
    pub width_max: Option<i32>,
    
    /// 高度筛选
    pub height_min: Option<i32>,
    pub height_max: Option<i32>,
    
    /// 是否收藏
    pub is_favorite: Option<bool>,
    
    /// 排序字段
    pub sort_by: Option<SortField>,
    
    /// 排序方向
    pub sort_order: Option<SortOrder>,
    
    /// 分页
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TagFilterMode {
    Any,  // OR
    All,  // AND
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SortField {
    FileName,
    FileSize,
    TakenAt,
    ImportedAt,
    Width,
    Height,
    Rating,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SortOrder {
    Asc,
    Desc,
}

/// 搜索结果
#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub photos: Vec<Photo>,
    pub total_count: i64,
    pub has_more: bool,
}

pub mod builder;
pub mod engine;

