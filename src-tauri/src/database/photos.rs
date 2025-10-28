// T057-T058: Photo实体DAO - CRUD操作
use crate::database::models::Photo;
use crate::error::{PhotoManError, Result};
use rusqlite::{params, Connection, OptionalExtension, Result as SqlResult};

/// Photo数据访问对象
pub struct PhotoDao;

impl PhotoDao {
    /// 插入新照片
    pub fn insert(conn: &Connection, photo: &Photo) -> Result<i64> {
        conn.execute(
            "INSERT INTO photos (
                file_path, file_name, file_size, file_hash, format,
                width, height, title, description, rating,
                taken_at, camera_make, camera_model, lens_model,
                focal_length, aperture, shutter_speed, iso,
                gps_latitude, gps_longitude, gps_altitude,
                is_favorite, is_deleted, deleted_at,
                created_at, updated_at, first_scanned_at
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
                ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18,
                ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27
            )",
            params![
                photo.file_path,
                photo.file_name,
                photo.file_size,
                photo.file_hash,
                photo.format,
                photo.width,
                photo.height,
                photo.title,
                photo.description,
                photo.rating,
                photo.taken_at,
                photo.camera_make,
                photo.camera_model,
                photo.lens_model,
                photo.focal_length,
                photo.aperture,
                photo.shutter_speed,
                photo.iso,
                photo.gps_latitude,
                photo.gps_longitude,
                photo.gps_altitude,
                photo.is_favorite,
                photo.is_deleted,
                photo.deleted_at,
                photo.created_at,
                photo.updated_at,
                photo.first_scanned_at
            ],
        )
        .map_err(|e| PhotoManError::database_error(format!("插入照片失败: {}", e)))?;

        Ok(conn.last_insert_rowid())
    }

    /// 批量插入照片 (T060: 批量插入优化)
    pub fn insert_batch(conn: &Connection, photos: &[Photo]) -> Result<usize> {
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| PhotoManError::database_error(format!("开启事务失败: {}", e)))?;

        let mut count = 0;
        for photo in photos {
            tx.execute(
                "INSERT OR IGNORE INTO photos (
                    file_path, file_name, file_size, file_hash, format,
                    width, height, rating, is_favorite, is_deleted,
                    created_at, updated_at, first_scanned_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                params![
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
                    photo.first_scanned_at
                ],
            )
            .map_err(|e| PhotoManError::database_error(format!("批量插入失败: {}", e)))?;
            count += 1;
        }

        tx.commit()
            .map_err(|e| PhotoManError::database_error(format!("提交事务失败: {}", e)))?;

        Ok(count)
    }

    /// 根据ID获取照片
    pub fn get_by_id(conn: &Connection, id: i64) -> Result<Option<Photo>> {
        let mut stmt = conn
            .prepare("SELECT * FROM photos WHERE id = ?1 AND is_deleted = 0")
            .map_err(|e| PhotoManError::database_error(format!("准备查询失败: {}", e)))?;

        let photo = stmt
            .query_row(params![id], Self::map_row)
            .optional()
            .map_err(|e| PhotoManError::database_error(format!("查询照片失败: {}", e)))?;

        Ok(photo)
    }

    /// 获取所有未删除的照片
    pub fn get_all(
        conn: &Connection,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<Vec<Photo>> {
        let sql = if let (Some(limit), Some(offset)) = (limit, offset) {
            format!(
                "SELECT * FROM photos WHERE is_deleted = 0 ORDER BY taken_at DESC, created_at DESC LIMIT {} OFFSET {}",
                limit, offset
            )
        } else {
            "SELECT * FROM photos WHERE is_deleted = 0 ORDER BY taken_at DESC, created_at DESC"
                .to_string()
        };

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| PhotoManError::database_error(format!("准备查询失败: {}", e)))?;

        let photos = stmt
            .query_map([], Self::map_row)
            .map_err(|e| PhotoManError::database_error(format!("查询照片列表失败: {}", e)))?
            .filter_map(|r| r.ok())
            .collect();

        Ok(photos)
    }

    /// 更新照片信息
    pub fn update(conn: &Connection, photo: &Photo) -> Result<()> {
        if let Some(id) = photo.id {
            conn.execute(
                "UPDATE photos SET
                    file_path = ?1, file_name = ?2, file_size = ?3,
                    title = ?4, description = ?5, rating = ?6,
                    is_favorite = ?7, updated_at = ?8
                 WHERE id = ?9",
                params![
                    photo.file_path,
                    photo.file_name,
                    photo.file_size,
                    photo.title,
                    photo.description,
                    photo.rating,
                    photo.is_favorite,
                    photo.updated_at,
                    id
                ],
            )
            .map_err(|e| PhotoManError::database_error(format!("更新照片失败: {}", e)))?;
            Ok(())
        } else {
            Err(PhotoManError::new(
                crate::error::ErrorCode::InvalidInput,
                "照片ID不能为空",
            ))
        }
    }

    /// 软删除照片
    pub fn soft_delete(conn: &Connection, id: i64) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE photos SET is_deleted = 1, deleted_at = ?1, updated_at = ?1 WHERE id = ?2",
            params![now, id],
        )
        .map_err(|e| PhotoManError::database_error(format!("软删除照片失败: {}", e)))?;
        Ok(())
    }

    /// 恢复照片
    pub fn restore(conn: &Connection, id: i64) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE photos SET is_deleted = 0, deleted_at = NULL, updated_at = ?1 WHERE id = ?2",
            params![now, id],
        )
        .map_err(|e| PhotoManError::database_error(format!("恢复照片失败: {}", e)))?;
        Ok(())
    }

    /// 永久删除照片
    pub fn delete(conn: &Connection, id: i64) -> Result<()> {
        conn.execute("DELETE FROM photos WHERE id = ?1", params![id])
            .map_err(|e| PhotoManError::database_error(format!("删除照片失败: {}", e)))?;
        Ok(())
    }

    /// 根据哈希查找照片
    pub fn find_by_hash(conn: &Connection, hash: &str) -> Result<Option<Photo>> {
        let mut stmt = conn
            .prepare("SELECT * FROM photos WHERE file_hash = ?1 AND is_deleted = 0 LIMIT 1")
            .map_err(|e| PhotoManError::database_error(format!("准备查询失败: {}", e)))?;

        let photo = stmt
            .query_row(params![hash], Self::map_row)
            .optional()
            .map_err(|e| PhotoManError::database_error(format!("查询照片失败: {}", e)))?;

        Ok(photo)
    }

    /// 统计照片数量
    pub fn count(conn: &Connection, include_deleted: bool) -> Result<i64> {
        let sql = if include_deleted {
            "SELECT COUNT(*) FROM photos"
        } else {
            "SELECT COUNT(*) FROM photos WHERE is_deleted = 0"
        };

        let count: i64 = conn
            .query_row(sql, [], |row| row.get(0))
            .map_err(|e| PhotoManError::database_error(format!("统计照片数量失败: {}", e)))?;

        Ok(count)
    }

    /// 映射数据库行到Photo对象
    fn map_row(row: &rusqlite::Row) -> SqlResult<Photo> {
        Ok(Photo {
            id: Some(row.get(0)?),
            file_path: row.get(1)?,
            file_name: row.get(2)?,
            file_size: row.get(3)?,
            file_hash: row.get(4)?,
            width: row.get(5)?,
            height: row.get(6)?,
            format: row.get(7)?,
            title: row.get(8)?,
            description: row.get(9)?,
            rating: row.get(10)?,
            taken_at: row.get(11)?,
            camera_make: row.get(12)?,
            camera_model: row.get(13)?,
            lens_model: row.get(14)?,
            focal_length: row.get(15)?,
            aperture: row.get(16)?,
            shutter_speed: row.get(17)?,
            iso: row.get(18)?,
            gps_latitude: row.get(19)?,
            gps_longitude: row.get(20)?,
            gps_altitude: row.get(21)?,
            is_favorite: row.get(22)?,
            is_deleted: row.get(23)?,
            deleted_at: row.get(24)?,
            created_at: row.get(25)?,
            updated_at: row.get(26)?,
            first_scanned_at: row.get(27)?,
        })
    }
}
