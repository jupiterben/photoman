// T091-T092: Tag DAO - 标签数据访问对象
use rusqlite::{params, Connection, OptionalExtension};
use crate::database::models::Tag;
use crate::error::{ErrorCode, PhotoManError, Result};

/// 标签数据访问对象
pub struct TagDao;

impl TagDao {
    /// 创建新标签
    pub fn create(conn: &Connection, name: &str, color: Option<&str>) -> Result<i64> {
        // 验证标签名
        if name.trim().is_empty() {
            return Err(PhotoManError::new(
                ErrorCode::InvalidInput,
                "Tag name cannot be empty",
            ));
        }

        // 检查是否已存在
        if Self::find_by_name(conn, name)?.is_some() {
            return Err(PhotoManError::new(
                ErrorCode::InvalidInput,
                format!("Tag '{}' already exists", name),
            ));
        }

        let now = chrono::Utc::now().timestamp();
        conn.execute(
            "INSERT INTO tags (name, color, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
            params![name, color, now, now],
        )
        .map_err(|e| PhotoManError::database_error(format!("创建标签失败: {}", e)))?;

        Ok(conn.last_insert_rowid())
    }

    /// 根据ID查找标签
    pub fn find_by_id(conn: &Connection, id: i64) -> Result<Option<Tag>> {
        conn.query_row(
            "SELECT id, name, color, parent_id, usage_count, created_at, updated_at FROM tags WHERE id = ?1",
            params![id],
            |row| {
                Ok(Tag {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    color: row.get(2)?,
                    parent_id: row.get(3)?,
                    usage_count: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
        .optional()
        .map_err(|e| PhotoManError::database_error(format!("查询标签失败: {}", e)))
    }

    /// 根据名称查找标签
    pub fn find_by_name(conn: &Connection, name: &str) -> Result<Option<Tag>> {
        conn.query_row(
            "SELECT id, name, color, parent_id, usage_count, created_at, updated_at FROM tags WHERE name = ?1",
            params![name],
            |row| {
                Ok(Tag {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    color: row.get(2)?,
                    parent_id: row.get(3)?,
                    usage_count: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
        .optional()
        .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))
    }

    /// 获取所有标签
    pub fn find_all(conn: &Connection) -> Result<Vec<Tag>> {
        let mut stmt = conn
            .prepare("SELECT id, name, color, parent_id, usage_count, created_at, updated_at FROM tags ORDER BY name")
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        let tags = stmt
            .query_map([], |row| {
                Ok(Tag {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    color: row.get(2)?,
                    parent_id: row.get(3)?,
                    usage_count: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        Ok(tags)
    }

    /// 获取使用最多的标签（用于自动补全）
    pub fn find_most_used(conn: &Connection, limit: i64) -> Result<Vec<Tag>> {
        let mut stmt = conn
            .prepare(
                "SELECT id, name, color, parent_id, usage_count, created_at, updated_at FROM tags 
                 WHERE usage_count > 0 
                 ORDER BY usage_count DESC, name 
                 LIMIT ?1",
            )
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        let tags = stmt
            .query_map(params![limit], |row| {
                Ok(Tag {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    color: row.get(2)?,
                    parent_id: row.get(3)?,
                    usage_count: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        Ok(tags)
    }

    /// 搜索标签（用于自动补全）
    pub fn search(conn: &Connection, query: &str, limit: i64) -> Result<Vec<Tag>> {
        let search_pattern = format!("%{}%", query);
        let mut stmt = conn
            .prepare(
                "SELECT id, name, color, parent_id, usage_count, created_at, updated_at FROM tags 
                 WHERE name LIKE ?1 
                 ORDER BY usage_count DESC, name 
                 LIMIT ?2",
            )
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        let tags = stmt
            .query_map(params![search_pattern, limit], |row| {
                Ok(Tag {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    color: row.get(2)?,
                    parent_id: row.get(3)?,
                    usage_count: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        Ok(tags)
    }

    /// 更新标签
    pub fn update(conn: &Connection, id: i64, name: Option<&str>, color: Option<&str>) -> Result<()> {
        // 验证标签存在
        if Self::find_by_id(conn, id)?.is_none() {
            return Err(PhotoManError::new(
                ErrorCode::InvalidInput,
                format!("Tag with id {} not found", id),
            ));
        }

        let now = chrono::Utc::now().timestamp();

        if let Some(new_name) = name {
            if new_name.trim().is_empty() {
                return Err(PhotoManError::new(
                    ErrorCode::InvalidInput,
                    "Tag name cannot be empty",
                ));
            }

            // 检查新名称是否已被其他标签使用
            if let Some(existing) = Self::find_by_name(conn, new_name)? {
                if existing.id != Some(id) {
                    return Err(PhotoManError::new(
                        ErrorCode::InvalidInput,
                        format!("Tag '{}' already exists", new_name),
                    ));
                }
            }

            conn.execute(
                "UPDATE tags SET name = ?1, updated_at = ?2 WHERE id = ?3",
                params![new_name, now, id],
            )
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;
        }

        if let Some(new_color) = color {
            conn.execute(
                "UPDATE tags SET color = ?1, updated_at = ?2 WHERE id = ?3",
                params![new_color, now, id],
            )
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;
        }

        Ok(())
    }

    /// T095: 更新标签使用统计
    pub fn increment_usage_count(conn: &Connection, tag_id: i64) -> Result<()> {
        conn.execute(
            "UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?1",
            params![tag_id],
        )
        .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        Ok(())
    }

    pub fn decrement_usage_count(conn: &Connection, tag_id: i64) -> Result<()> {
        conn.execute(
            "UPDATE tags SET usage_count = CASE WHEN usage_count > 0 THEN usage_count - 1 ELSE 0 END WHERE id = ?1",
            params![tag_id],
        )
        .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        Ok(())
    }

    /// 删除标签
    pub fn delete(conn: &Connection, id: i64) -> Result<()> {
        // 先删除关联的photo_tags记录
        conn.execute("DELETE FROM photo_tags WHERE tag_id = ?1", params![id])
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        // 删除标签
        let rows_affected = conn
            .execute("DELETE FROM tags WHERE id = ?1", params![id])
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        if rows_affected == 0 {
            return Err(PhotoManError::new(
                ErrorCode::InvalidInput,
                format!("Tag with id {} not found", id),
            ));
        }

        Ok(())
    }

    /// 获取标签统计信息
    pub fn get_stats(conn: &Connection) -> Result<TagStats> {
        let total_tags: i64 = conn
            .query_row("SELECT COUNT(*) FROM tags", [], |row| row.get(0))
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        let used_tags: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM tags WHERE usage_count > 0",
                [],
                |row| row.get(0),
            )
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        let total_associations: i64 = conn
            .query_row("SELECT COUNT(*) FROM photo_tags", [], |row| row.get(0))
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        Ok(TagStats {
            total_tags,
            used_tags,
            unused_tags: total_tags - used_tags,
            total_associations,
        })
    }
}

/// 标签统计信息
#[derive(Debug, Clone, serde::Serialize)]
pub struct TagStats {
    pub total_tags: i64,
    pub used_tags: i64,
    pub unused_tags: i64,
    pub total_associations: i64,
}

