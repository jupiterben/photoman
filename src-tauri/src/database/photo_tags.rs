// T093-T094: PhotoTag DAO - 照片-标签关联数据访问对象
use rusqlite::{params, Connection};
use crate::database::models::Tag;
use crate::database::tags::TagDao;
use crate::error::{PhotoManError, Result};

/// 照片-标签关联数据访问对象
pub struct PhotoTagDao;

impl PhotoTagDao {
    /// 为照片添加标签
    pub fn add_tag_to_photo(conn: &Connection, photo_id: i64, tag_id: i64) -> Result<()> {
        // 检查是否已存在关联
        let exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM photo_tags WHERE photo_id = ?1 AND tag_id = ?2)",
                params![photo_id, tag_id],
                |row| row.get(0),
            )
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        if exists {
            return Ok(()); // 已存在，不重复添加
        }

        let now = chrono::Utc::now().timestamp();
        conn.execute(
            "INSERT INTO photo_tags (photo_id, tag_id, created_at) VALUES (?1, ?2, ?3)",
            params![photo_id, tag_id, now],
        )
        .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        // 更新标签使用计数
        TagDao::increment_usage_count(conn, tag_id)?;

        Ok(())
    }

    /// 从照片移除标签
    pub fn remove_tag_from_photo(conn: &Connection, photo_id: i64, tag_id: i64) -> Result<()> {
        let rows_affected = conn
            .execute(
                "DELETE FROM photo_tags WHERE photo_id = ?1 AND tag_id = ?2",
                params![photo_id, tag_id],
            )
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        if rows_affected > 0 {
            // 更新标签使用计数
            TagDao::decrement_usage_count(conn, tag_id)?;
        }

        Ok(())
    }

    /// T094: 批量添加标签到照片
    pub fn add_tag_to_photos(conn: &Connection, photo_ids: &[i64], tag_id: i64) -> Result<i64> {
        let mut added_count = 0i64;

        for photo_id in photo_ids {
            // 检查关联是否已存在
            let exists: bool = conn
                .query_row(
                    "SELECT EXISTS(SELECT 1 FROM photo_tags WHERE photo_id = ?1 AND tag_id = ?2)",
                    params![photo_id, tag_id],
                    |row| row.get(0),
                )
                .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

            if !exists {
                let now = chrono::Utc::now().timestamp();
                conn.execute(
                    "INSERT INTO photo_tags (photo_id, tag_id, created_at) VALUES (?1, ?2, ?3)",
                    params![photo_id, tag_id, now],
                )
                .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

                added_count += 1;
            }
        }

        // 一次性更新标签使用计数
        if added_count > 0 {
            conn.execute(
                "UPDATE tags SET usage_count = usage_count + ?1 WHERE id = ?2",
                params![added_count, tag_id],
            )
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;
        }

        Ok(added_count)
    }

    /// 批量从照片移除标签
    pub fn remove_tag_from_photos(conn: &Connection, photo_ids: &[i64], tag_id: i64) -> Result<i64> {
        let placeholders = photo_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let query = format!(
            "DELETE FROM photo_tags WHERE photo_id IN ({}) AND tag_id = ?",
            placeholders
        );

        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = photo_ids
            .iter()
            .map(|id| Box::new(*id) as Box<dyn rusqlite::ToSql>)
            .collect();
        params_vec.push(Box::new(tag_id));

        let rows_affected = conn
            .execute(&query, rusqlite::params_from_iter(params_vec.iter()))
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        // 更新标签使用计数
        if rows_affected > 0 {
            conn.execute(
                "UPDATE tags SET usage_count = CASE WHEN usage_count >= ?1 THEN usage_count - ?1 ELSE 0 END WHERE id = ?2",
                params![rows_affected as i64, tag_id],
            )
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;
        }

        Ok(rows_affected as i64)
    }

    /// 获取照片的所有标签
    pub fn get_tags_for_photo(conn: &Connection, photo_id: i64) -> Result<Vec<Tag>> {
        let mut stmt = conn
            .prepare(
                "SELECT t.id, t.name, t.color, t.parent_id, t.usage_count, t.created_at, t.updated_at 
                 FROM tags t 
                 INNER JOIN photo_tags pt ON t.id = pt.tag_id 
                 WHERE pt.photo_id = ?1 
                 ORDER BY t.name",
            )
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        let tags = stmt
            .query_map(params![photo_id], |row| {
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

    /// 获取包含指定标签的照片ID列表
    pub fn get_photo_ids_by_tag(conn: &Connection, tag_id: i64) -> Result<Vec<i64>> {
        let mut stmt = conn
            .prepare("SELECT photo_id FROM photo_tags WHERE tag_id = ?1 ORDER BY created_at DESC")
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        let photo_ids = stmt
            .query_map(params![tag_id], |row| row.get(0))
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        Ok(photo_ids)
    }

    /// 获取包含任意指定标签的照片ID列表（OR逻辑）
    pub fn get_photo_ids_by_any_tags(conn: &Connection, tag_ids: &[i64]) -> Result<Vec<i64>> {
        if tag_ids.is_empty() {
            return Ok(Vec::new());
        }

        let placeholders = tag_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let query = format!(
            "SELECT DISTINCT photo_id FROM photo_tags WHERE tag_id IN ({}) ORDER BY photo_id",
            placeholders
        );

        let params_vec: Vec<Box<dyn rusqlite::ToSql>> = tag_ids
            .iter()
            .map(|id| Box::new(*id) as Box<dyn rusqlite::ToSql>)
            .collect();

        let mut stmt = conn
            .prepare(&query)
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        let photo_ids = stmt
            .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| row.get(0))
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        Ok(photo_ids)
    }

    /// 获取包含所有指定标签的照片ID列表（AND逻辑）
    pub fn get_photo_ids_by_all_tags(conn: &Connection, tag_ids: &[i64]) -> Result<Vec<i64>> {
        if tag_ids.is_empty() {
            return Ok(Vec::new());
        }

        let placeholders = tag_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let query = format!(
            "SELECT photo_id FROM photo_tags 
             WHERE tag_id IN ({}) 
             GROUP BY photo_id 
             HAVING COUNT(DISTINCT tag_id) = ? 
             ORDER BY photo_id",
            placeholders
        );

        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = tag_ids
            .iter()
            .map(|id| Box::new(*id) as Box<dyn rusqlite::ToSql>)
            .collect();
        params_vec.push(Box::new(tag_ids.len() as i64));

        let mut stmt = conn
            .prepare(&query)
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        let photo_ids = stmt
            .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| row.get(0))
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        Ok(photo_ids)
    }

    /// 删除照片的所有标签
    pub fn remove_all_tags_from_photo(conn: &Connection, photo_id: i64) -> Result<()> {
        // 获取所有关联的标签ID
        let tag_ids: Vec<i64> = conn
            .prepare("SELECT tag_id FROM photo_tags WHERE photo_id = ?1")
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?
            .query_map(params![photo_id], |row| row.get(0))
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        // 删除关联
        conn.execute("DELETE FROM photo_tags WHERE photo_id = ?1", params![photo_id])
            .map_err(|e| PhotoManError::database_error(format!("数据库操作失败: {}", e)))?;

        // 更新所有相关标签的使用计数
        for tag_id in tag_ids {
            TagDao::decrement_usage_count(conn, tag_id)?;
        }

        Ok(())
    }
}

