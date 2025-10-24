// Data models for PhotoMan
use serde::{Deserialize, Serialize};

// ==================== Photo ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Photo {
    pub id: Option<i64>,
    pub file_path: String,
    pub file_name: String,
    pub file_size: i64,
    pub file_hash: String,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub format: String,

    // EXIF metadata
    pub title: Option<String>,
    pub description: Option<String>,
    pub rating: i32,
    pub taken_at: Option<String>,
    pub camera_make: Option<String>,
    pub camera_model: Option<String>,
    pub lens_model: Option<String>,
    pub focal_length: Option<f64>,
    pub aperture: Option<f64>,
    pub shutter_speed: Option<String>,
    pub iso: Option<i32>,
    pub gps_latitude: Option<f64>,
    pub gps_longitude: Option<f64>,
    pub gps_altitude: Option<f64>,

    // System fields
    pub is_favorite: bool,
    pub is_deleted: bool,
    pub deleted_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub first_scanned_at: String,
}

impl Photo {
    pub fn new(
        file_path: String,
        file_name: String,
        file_size: i64,
        file_hash: String,
        format: String,
    ) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: None,
            file_path,
            file_name,
            file_size,
            file_hash,
            width: None,
            height: None,
            format,
            title: None,
            description: None,
            rating: 0,
            taken_at: None,
            camera_make: None,
            camera_model: None,
            lens_model: None,
            focal_length: None,
            aperture: None,
            shutter_speed: None,
            iso: None,
            gps_latitude: None,
            gps_longitude: None,
            gps_altitude: None,
            is_favorite: false,
            is_deleted: false,
            deleted_at: None,
            created_at: now.clone(),
            updated_at: now.clone(),
            first_scanned_at: now,
        }
    }

    pub fn validate(&self) -> Result<(), String> {
        if self.file_path.is_empty() {
            return Err("文件路径不能为空".to_string());
        }
        if self.file_hash.len() != 64 {
            return Err("文件哈希必须是64字符的SHA-256值".to_string());
        }
        if self.rating < 0 || self.rating > 5 {
            return Err("评分必须在0-5之间".to_string());
        }
        if self.is_deleted && self.deleted_at.is_none() {
            return Err("已删除的图片必须有删除时间".to_string());
        }
        Ok(())
    }
}

// ==================== Tag ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: Option<i64>,
    pub name: String,
    pub color: Option<String>,
    pub parent_id: Option<i64>,
    pub usage_count: i32,
    pub created_at: String,
    pub updated_at: String,
}

impl Tag {
    pub fn new(name: String) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: None,
            name,
            color: None,
            parent_id: None,
            usage_count: 0,
            created_at: now.clone(),
            updated_at: now,
        }
    }

    pub fn validate(&self) -> Result<(), String> {
        if self.name.trim().is_empty() {
            return Err("标签名称不能为空".to_string());
        }
        if self.name.len() > 50 {
            return Err("标签名称不能超过50个字符".to_string());
        }
        if let Some(color) = &self.color {
            if !color.starts_with('#') || color.len() != 7 {
                return Err("颜色必须是HEX格式（如#FF5733）".to_string());
            }
        }
        Ok(())
    }
}

// ==================== Album ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Album {
    pub id: Option<i64>,
    pub name: String,
    pub description: Option<String>,
    pub cover_photo_id: Option<i64>,
    pub sort_order: String,
    pub created_at: String,
    pub updated_at: String,
}

impl Album {
    pub fn new(name: String) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: None,
            name,
            description: None,
            cover_photo_id: None,
            sort_order: "date_desc".to_string(),
            created_at: now.clone(),
            updated_at: now,
        }
    }

    pub fn validate(&self) -> Result<(), String> {
        if self.name.trim().is_empty() {
            return Err("相册名称不能为空".to_string());
        }
        let valid_orders = ["date_desc", "date_asc", "name", "custom"];
        if !valid_orders.contains(&self.sort_order.as_str()) {
            return Err("排序规则无效".to_string());
        }
        Ok(())
    }
}

// ==================== ScanJob ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanJob {
    pub id: Option<i64>,
    pub target_path: String,
    pub status: String,
    pub total_files: i32,
    pub processed_files: i32,
    pub found_photos: i32,
    pub duplicates_skipped: i32,
    pub error_message: Option<String>,
    pub started_at: String,
    pub finished_at: Option<String>,
}

impl ScanJob {
    pub fn new(target_path: String) -> Self {
        Self {
            id: None,
            target_path,
            status: "running".to_string(),
            total_files: 0,
            processed_files: 0,
            found_photos: 0,
            duplicates_skipped: 0,
            error_message: None,
            started_at: chrono::Utc::now().to_rfc3339(),
            finished_at: None,
        }
    }
}

// ==================== ThumbnailCache ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThumbnailCache {
    pub id: Option<i64>,
    pub photo_id: i64,
    pub size_type: String,
    pub cache_path: String,
    pub file_size: i64,
    pub generated_at: String,
    pub last_accessed_at: String,
}

// ==================== SmartAlbum ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartAlbum {
    pub id: Option<i64>,
    pub name: String,
    pub filter_json: String,
    pub created_at: String,
    pub updated_at: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_photo_validation() {
        let mut photo = Photo::new(
            "/path/to/image.jpg".to_string(),
            "image.jpg".to_string(),
            1024,
            "a".repeat(64),
            "jpg".to_string(),
        );
        assert!(photo.validate().is_ok());

        photo.rating = 6;
        assert!(photo.validate().is_err());

        photo.rating = 3;
        photo.file_hash = "short".to_string();
        assert!(photo.validate().is_err());
    }

    #[test]
    fn test_tag_validation() {
        let mut tag = Tag::new("风景".to_string());
        assert!(tag.validate().is_ok());

        tag.name = "".to_string();
        assert!(tag.validate().is_err());

        tag.name = "a".repeat(51);
        assert!(tag.validate().is_err());

        let mut tag2 = Tag::new("颜色".to_string());
        tag2.color = Some("#FF5733".to_string());
        assert!(tag2.validate().is_ok());

        tag2.color = Some("FF5733".to_string());
        assert!(tag2.validate().is_err());
    }

    #[test]
    fn test_album_validation() {
        let mut album = Album::new("我的相册".to_string());
        assert!(album.validate().is_ok());

        album.name = "".to_string();
        assert!(album.validate().is_err());

        album.name = "测试".to_string();
        album.sort_order = "invalid".to_string();
        assert!(album.validate().is_err());
    }
}

