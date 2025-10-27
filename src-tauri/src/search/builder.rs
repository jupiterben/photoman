// T120: 组合查询构建器
use super::{SearchQuery, SortField, SortOrder, TagFilterMode};

/// SQL查询构建器
pub struct QueryBuilder {
    conditions: Vec<String>,
    params: Vec<Box<dyn rusqlite::ToSql>>,
}

impl QueryBuilder {
    pub fn new() -> Self {
        Self {
            conditions: Vec::new(),
            params: Vec::new(),
        }
    }

    pub fn build_from_search_query(query: &SearchQuery) -> (String, Vec<Box<dyn rusqlite::ToSql>>) {
        let mut builder = Self::new();

        // 基础查询（排除已删除的照片）
        builder.add_condition("is_deleted = 0");

        // 全文搜索（文件名、描述、标题）
        if let Some(keyword) = &query.keyword {
            if !keyword.is_empty() {
                builder.add_condition("(file_name LIKE ? OR title LIKE ? OR description LIKE ?)");
                let pattern = format!("%{}%", keyword);
                builder.add_param(pattern.clone());
                builder.add_param(pattern.clone());
                builder.add_param(pattern);
            }
        }

        // 日期范围筛选（使用first_scanned_at）
        if let Some(from) = query.date_from {
            builder.add_condition("first_scanned_at >= ?");
            builder.add_param(from);
        }
        if let Some(to) = query.date_to {
            builder.add_condition("first_scanned_at <= ?");
            builder.add_param(to);
        }

        // 文件大小筛选
        if let Some(min) = query.size_min {
            builder.add_condition("file_size >= ?");
            builder.add_param(min);
        }
        if let Some(max) = query.size_max {
            builder.add_condition("file_size <= ?");
            builder.add_param(max);
        }

        // 文件格式筛选
        if let Some(formats) = &query.formats {
            if !formats.is_empty() {
                let placeholders = formats.iter().map(|_| "?").collect::<Vec<_>>().join(",");
                builder.add_condition(&format!("format IN ({})", placeholders));
                for format in formats {
                    builder.add_param(format.clone());
                }
            }
        }

        // 尺寸筛选
        if let Some(min) = query.width_min {
            builder.add_condition("width >= ?");
            builder.add_param(min);
        }
        if let Some(max) = query.width_max {
            builder.add_condition("width <= ?");
            builder.add_param(max);
        }
        if let Some(min) = query.height_min {
            builder.add_condition("height >= ?");
            builder.add_param(min);
        }
        if let Some(max) = query.height_max {
            builder.add_condition("height <= ?");
            builder.add_param(max);
        }

        // 收藏筛选
        if let Some(is_fav) = query.is_favorite {
            builder.add_condition("is_favorite = ?");
            builder.add_param(if is_fav { 1 } else { 0 });
        }

        // 标签筛选（通过子查询）
        if let Some(tag_ids) = &query.tag_ids {
            if !tag_ids.is_empty() {
                match query.tag_mode.as_ref().unwrap_or(&TagFilterMode::Any) {
                    TagFilterMode::Any => {
                        // OR逻辑：照片至少包含其中一个标签
                        let placeholders = tag_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
                        builder.add_condition(&format!(
                            "id IN (SELECT photo_id FROM photo_tags WHERE tag_id IN ({}))",
                            placeholders
                        ));
                        for id in tag_ids {
                            builder.add_param(*id);
                        }
                    }
                    TagFilterMode::All => {
                        // AND逻辑：照片包含所有标签
                        let placeholders = tag_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
                        builder.add_condition(&format!(
                            "id IN (SELECT photo_id FROM photo_tags WHERE tag_id IN ({}) GROUP BY photo_id HAVING COUNT(DISTINCT tag_id) = ?)",
                            placeholders
                        ));
                        for id in tag_ids {
                            builder.add_param(*id);
                        }
                        builder.add_param(tag_ids.len() as i64);
                    }
                }
            }
        }

        let where_clause = if builder.conditions.is_empty() {
            String::new()
        } else {
            format!("WHERE {}", builder.conditions.join(" AND "))
        };

        // 排序
        let order_clause = match query.sort_by.as_ref() {
            Some(SortField::FileName) => "ORDER BY file_name",
            Some(SortField::FileSize) => "ORDER BY file_size",
            Some(SortField::TakenAt) => "ORDER BY taken_at",
            Some(SortField::ImportedAt) => "ORDER BY first_scanned_at",
            Some(SortField::Width) => "ORDER BY width",
            Some(SortField::Height) => "ORDER BY height",
            Some(SortField::Rating) => "ORDER BY rating",
            None => "ORDER BY first_scanned_at",
        };

        let order_direction = match query.sort_order.as_ref() {
            Some(SortOrder::Asc) => "ASC",
            Some(SortOrder::Desc) | None => "DESC",
        };

        // 分页
        let limit = query.limit.unwrap_or(100);
        let offset = query.offset.unwrap_or(0);

        let sql = format!(
            "SELECT * FROM photos {} {} {} LIMIT {} OFFSET {}",
            where_clause, order_clause, order_direction, limit, offset
        );

        (sql, builder.params)
    }

    fn add_condition(&mut self, condition: &str) {
        self.conditions.push(condition.to_string());
    }

    fn add_param<T: rusqlite::ToSql + 'static>(&mut self, param: T) {
        self.params.push(Box::new(param));
    }
}

/// 构建计数查询
pub fn build_count_query(query: &SearchQuery) -> (String, Vec<Box<dyn rusqlite::ToSql>>) {
    let (sql, params) = QueryBuilder::build_from_search_query(query);
    
    // 将 SELECT * FROM photos 替换为 SELECT COUNT(*) FROM photos
    let count_sql = sql.replacen("SELECT * FROM photos", "SELECT COUNT(*) FROM photos", 1);
    
    // 移除 LIMIT 和 OFFSET
    let count_sql = count_sql.split("LIMIT").next().unwrap().to_string();
    
    (count_sql, params)
}

