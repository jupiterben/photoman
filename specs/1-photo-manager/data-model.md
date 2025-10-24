# PhotoMan - 数据模型设计

## 概述

本文档定义了PhotoMan应用的完整数据模型，包括数据库Schema、Rust结构体定义、实体关系和验证规则。

## 技术栈

- **数据库**: SQLite 3.x
- **ORM/库**: rusqlite (Rust)
- **迁移**: 自定义Rust迁移机制
- **序列化**: serde + serde_json

## 数据库Schema

### 表结构

#### 1. photos (图片表)

主要实体，存储图片的基本信息和元数据。

```sql
CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL UNIQUE,  -- 文件绝对路径
    file_name TEXT NOT NULL,          -- 文件名（带扩展名）
    file_size INTEGER NOT NULL,       -- 文件大小（字节）
    file_hash TEXT NOT NULL,          -- SHA-256哈希值（用于重复检测）
    width INTEGER,                    -- 图片宽度（像素）
    height INTEGER,                   -- 图片高度（像素）
    format TEXT NOT NULL,             -- 文件格式（JPG/PNG/WebP等）
    
    -- EXIF元数据
    title TEXT,                       -- 标题
    description TEXT,                 -- 描述
    rating INTEGER DEFAULT 0,         -- 评分（0-5星）
    taken_at TEXT,                    -- 拍摄日期（ISO 8601格式）
    camera_make TEXT,                 -- 相机制造商
    camera_model TEXT,                -- 相机型号
    lens_model TEXT,                  -- 镜头型号
    focal_length REAL,                -- 焦距（mm）
    aperture REAL,                    -- 光圈（f值）
    shutter_speed TEXT,               -- 快门速度
    iso INTEGER,                      -- ISO感光度
    gps_latitude REAL,                -- GPS纬度
    gps_longitude REAL,               -- GPS经度
    gps_altitude REAL,                -- GPS海拔（米）
    
    -- 系统字段
    is_favorite BOOLEAN DEFAULT 0,    -- 是否收藏
    is_deleted BOOLEAN DEFAULT 0,     -- 软删除标记
    deleted_at TEXT,                  -- 删除时间
    created_at TEXT NOT NULL,         -- 记录创建时间
    updated_at TEXT NOT NULL,         -- 记录更新时间
    first_scanned_at TEXT NOT NULL,   -- 首次扫描时间（用于重复判断优先级）
    
    CONSTRAINT chk_rating CHECK (rating >= 0 AND rating <= 5),
    CONSTRAINT chk_deleted CHECK (
        (is_deleted = 0 AND deleted_at IS NULL) OR 
        (is_deleted = 1 AND deleted_at IS NOT NULL)
    )
);

CREATE INDEX idx_photos_file_hash ON photos(file_hash);
CREATE INDEX idx_photos_file_path ON photos(file_path);
CREATE INDEX idx_photos_is_deleted ON photos(is_deleted);
CREATE INDEX idx_photos_is_favorite ON photos(is_favorite);
CREATE INDEX idx_photos_taken_at ON photos(taken_at);
CREATE INDEX idx_photos_format ON photos(format);
CREATE INDEX idx_photos_rating ON photos(rating);
```

#### 2. tags (标签表)

标签系统，支持层级标签。

```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,        -- 标签名称
    color TEXT,                       -- 标签颜色（HEX格式，如#FF5733）
    parent_id INTEGER,                -- 父标签ID（支持层级）
    usage_count INTEGER DEFAULT 0,    -- 使用次数
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    
    FOREIGN KEY (parent_id) REFERENCES tags(id) ON DELETE SET NULL
);

CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_parent_id ON tags(parent_id);
```

#### 3. photo_tags (图片标签关联表)

多对多关系表。

```sql
CREATE TABLE photo_tags (
    photo_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    
    PRIMARY KEY (photo_id, tag_id),
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX idx_photo_tags_tag_id ON photo_tags(tag_id);
```

#### 4. albums (相册表)

用户创建的相册集合。

```sql
CREATE TABLE albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,        -- 相册名称
    description TEXT,                 -- 相册描述
    cover_photo_id INTEGER,           -- 封面图片ID
    sort_order TEXT DEFAULT 'date_desc', -- 排序规则
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    
    FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL,
    CONSTRAINT chk_sort_order CHECK (sort_order IN ('date_desc', 'date_asc', 'name', 'custom'))
);

CREATE INDEX idx_albums_name ON albums(name);
```

#### 5. album_photos (相册图片关联表)

多对多关系表，支持自定义排序。

```sql
CREATE TABLE album_photos (
    album_id INTEGER NOT NULL,
    photo_id INTEGER NOT NULL,
    display_order INTEGER,            -- 自定义排序顺序
    created_at TEXT NOT NULL,
    
    PRIMARY KEY (album_id, photo_id),
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);

CREATE INDEX idx_album_photos_album_id ON album_photos(album_id);
CREATE INDEX idx_album_photos_photo_id ON album_photos(photo_id);
CREATE INDEX idx_album_photos_display_order ON album_photos(album_id, display_order);
```

#### 6. scan_jobs (扫描任务表)

记录扫描任务历史和状态。

```sql
CREATE TABLE scan_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_path TEXT NOT NULL,        -- 扫描目标路径
    status TEXT NOT NULL DEFAULT 'running', -- 状态
    total_files INTEGER DEFAULT 0,    -- 总文件数
    processed_files INTEGER DEFAULT 0,-- 已处理文件数
    found_photos INTEGER DEFAULT 0,   -- 发现的图片数
    duplicates_skipped INTEGER DEFAULT 0, -- 跳过的重复数
    error_message TEXT,               -- 错误信息
    started_at TEXT NOT NULL,
    finished_at TEXT,
    
    CONSTRAINT chk_status CHECK (status IN ('running', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX idx_scan_jobs_status ON scan_jobs(status);
CREATE INDEX idx_scan_jobs_started_at ON scan_jobs(started_at);
```

#### 7. thumbnail_cache (缩略图缓存表)

缩略图元数据（实际文件存储在文件系统）。

```sql
CREATE TABLE thumbnail_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photo_id INTEGER NOT NULL,
    size_type TEXT NOT NULL,          -- 尺寸类型：small/medium
    cache_path TEXT NOT NULL,         -- 缓存文件路径
    file_size INTEGER NOT NULL,       -- 缓存文件大小
    generated_at TEXT NOT NULL,
    last_accessed_at TEXT NOT NULL,   -- 最后访问时间（用于LRU）
    
    UNIQUE(photo_id, size_type),
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    CONSTRAINT chk_size_type CHECK (size_type IN ('small', 'medium'))
);

CREATE INDEX idx_thumbnail_cache_photo_id ON thumbnail_cache(photo_id);
CREATE INDEX idx_thumbnail_cache_last_accessed ON thumbnail_cache(last_accessed_at);
```

#### 8. settings (设置表)

应用设置，key-value存储。

```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 预设默认值
INSERT INTO settings (key, value, updated_at) VALUES
    ('theme', 'system', datetime('now')),
    ('language', 'zh-CN', datetime('now')),
    ('cache_size_limit', '5368709120', datetime('now')),  -- 5GB
    ('recycle_bin_days', '30', datetime('now')),
    ('backup_time', '02:00', datetime('now')),
    ('backup_day', 'sunday', datetime('now'));
```

#### 9. smart_albums (智能相册表)

保存的搜索/筛选条件。

```sql
CREATE TABLE smart_albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    filter_json TEXT NOT NULL,        -- JSON格式的筛选条件
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_smart_albums_name ON smart_albums(name);
```

## Rust数据结构

### 核心实体

#### Photo

```rust
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

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
    
    // EXIF元数据
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
    
    // 系统字段
    pub is_favorite: bool,
    pub is_deleted: bool,
    pub deleted_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub first_scanned_at: String,
}

impl Photo {
    pub fn new(file_path: String, file_name: String, file_size: i64, file_hash: String, format: String) -> Self {
        let now = Utc::now().to_rfc3339();
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
}
```

#### Tag

```rust
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
        let now = Utc::now().to_rfc3339();
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
}
```

#### Album

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Album {
    pub id: Option<i64>,
    pub name: String,
    pub description: Option<String>,
    pub cover_photo_id: Option<i64>,
    pub sort_order: SortOrder,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SortOrder {
    DateDesc,
    DateAsc,
    Name,
    Custom,
}

impl Album {
    pub fn new(name: String) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            id: None,
            name,
            description: None,
            cover_photo_id: None,
            sort_order: SortOrder::DateDesc,
            created_at: now.clone(),
            updated_at: now,
        }
    }
}
```

#### ScanJob

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanJob {
    pub id: Option<i64>,
    pub target_path: String,
    pub status: ScanStatus,
    pub total_files: i32,
    pub processed_files: i32,
    pub found_photos: i32,
    pub duplicates_skipped: i32,
    pub error_message: Option<String>,
    pub started_at: String,
    pub finished_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ScanStatus {
    Running,
    Completed,
    Failed,
    Cancelled,
}

impl ScanJob {
    pub fn new(target_path: String) -> Self {
        Self {
            id: None,
            target_path,
            status: ScanStatus::Running,
            total_files: 0,
            processed_files: 0,
            found_photos: 0,
            duplicates_skipped: 0,
            error_message: None,
            started_at: Utc::now().to_rfc3339(),
            finished_at: None,
        }
    }
}
```

## 实体关系图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   photos    │──────<│ photo_tags  │>──────│    tags     │
└─────────────┘       └─────────────┘       └─────────────┘
       │                                            │
       │                                            │ (自引用)
       │                                            │
       │              ┌─────────────┐               │
       └─────────────<│album_photos │>──────────────┘
                      └─────────────┘
                             │
                             │
                      ┌─────────────┐
                      │   albums    │
                      └─────────────┘
```

## 数据验证规则

### Photo验证

```rust
impl Photo {
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
```

### Tag验证

```rust
impl Tag {
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
```

## 数据库迁移

### 迁移机制

```rust
pub struct Migration {
    pub version: i32,
    pub name: String,
    pub up: fn(&rusqlite::Connection) -> rusqlite::Result<()>,
}

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            name: "initial_schema".to_string(),
            up: migration_001_initial_schema,
        },
        // 后续迁移...
    ]
}

fn migration_001_initial_schema(conn: &rusqlite::Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE photos (...);
        CREATE TABLE tags (...);
        CREATE TABLE photo_tags (...);
        -- ... 其他表
        
        CREATE TABLE schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );
        
        INSERT INTO schema_migrations (version, applied_at)
        VALUES (1, datetime('now'));
        "
    )?;
    Ok(())
}
```

## 查询优化

### 常用查询索引

1. **按标签筛选图片**: `idx_photo_tags_tag_id`
2. **按日期范围查询**: `idx_photos_taken_at`
3. **查找重复图片**: `idx_photos_file_hash`
4. **回收站查询**: `idx_photos_is_deleted`
5. **收藏图片查询**: `idx_photos_is_favorite`

### 复合查询示例

```sql
-- 查询特定标签的非删除图片，按拍摄日期倒序
SELECT p.* 
FROM photos p
INNER JOIN photo_tags pt ON p.id = pt.photo_id
WHERE pt.tag_id = ?
  AND p.is_deleted = 0
ORDER BY p.taken_at DESC
LIMIT ? OFFSET ?;
```

## 数据完整性

### 级联删除

- 删除图片时，自动删除关联的 `photo_tags`、`album_photos`、`thumbnail_cache`
- 删除标签时，自动删除关联的 `photo_tags`
- 删除相册时，自动删除关联的 `album_photos`

### 软删除

- 图片删除使用软删除标记 (`is_deleted = 1`)
- 保留30天后可永久删除
- 恢复时清除软删除标记

## 总结

PhotoMan的数据模型设计遵循以下原则：

1. **规范化**: 避免数据冗余，使用关联表处理多对多关系
2. **索引优化**: 为常用查询字段添加索引
3. **类型安全**: Rust结构体提供编译时类型检查
4. **可扩展**: 易于添加新字段和关系
5. **数据完整性**: 外键约束和验证规则确保数据一致性

