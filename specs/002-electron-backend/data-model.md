# PhotoMan Electron - 数据模型设计

## 概述

本文档定义Electron版本PhotoMan的数据模型。数据库schema与Tauri版本**完全兼容**,仅数据访问层从Rust迁移到TypeScript。

## 技术栈

- **数据库**: SQLite 3.x
- **Node.js库**: better-sqlite3
- **类型系统**: TypeScript 5
- **序列化**: 原生JSON

## 数据库Schema

### 核心原则

1. **完全兼容**: 与Tauri版本的SQLite数据库格式100%兼容
2. **无需迁移**: 用户数据直接使用,无需任何转换
3. **Schema不变**: 表结构、索引、约束完全一致

### 表结构

数据库包含9张表,结构与[Tauri版本](../1-photo-manager/data-model.md)完全一致:

1. **photos** - 图片元数据
2. **tags** - 标签系统
3. **photo_tags** - 图片-标签关联(多对多)
4. **albums** - 相册集合
5. **album_photos** - 相册-图片关联(多对多)
6. **scan_jobs** - 扫描任务记录
7. **thumbnail_cache** - 缩略图缓存元数据
8. **settings** - 应用设置(key-value)
9. **smart_albums** - 智能相册(保存的筛选条件)

详细SQL定义参见[Tauri版本数据模型](../1-photo-manager/data-model.md#数据库schema)。

## TypeScript类型定义

### 核心实体

#### Photo

```typescript
export interface Photo {
  id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  width: number | null;
  height: number | null;
  format: string;
  
  // EXIF元数据
  title: string | null;
  description: string | null;
  rating: number;
  taken_at: string | null;
  camera_make: string | null;
  camera_model: string | null;
  lens_model: string | null;
  focal_length: number | null;
  aperture: number | null;
  shutter_speed: string | null;
  iso: number | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_altitude: number | null;
  
  // 系统字段
  is_favorite: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  first_scanned_at: string;
}

export interface CreatePhotoInput {
  file_path: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  format: string;
  width?: number;
  height?: number;
}

export interface UpdatePhotoInput {
  id: number;
  title?: string;
  description?: string;
  rating?: number;
  is_favorite?: boolean;
}
```

#### Tag

```typescript
export interface Tag {
  id: number;
  name: string;
  color: string | null;
  parent_id: number | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTagInput {
  name: string;
  color?: string;
  parent_id?: number;
}

export interface UpdateTagInput {
  id: number;
  name?: string;
  color?: string;
  parent_id?: number;
}
```

#### Album

```typescript
export interface Album {
  id: number;
  name: string;
  description: string | null;
  cover_photo_id: number | null;
  sort_order: 'date_desc' | 'date_asc' | 'name' | 'custom';
  created_at: string;
  updated_at: string;
}

export interface CreateAlbumInput {
  name: string;
  description?: string;
  sort_order?: 'date_desc' | 'date_asc' | 'name' | 'custom';
}
```

#### ScanJob

```typescript
export interface ScanJob {
  id: number;
  target_path: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  total_files: number;
  processed_files: number;
  found_photos: number;
  duplicates_skipped: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface ScanProgress {
  total_files: number;
  processed_files: number;
  found_photos: number;
  current_file: string;
}
```

#### ThumbnailCache

```typescript
export interface ThumbnailCache {
  id: number;
  photo_id: number;
  size_type: 'small' | 'medium';
  cache_path: string;
  file_size: number;
  generated_at: string;
  last_accessed_at: string;
}
```

#### Settings

```typescript
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  cache_size_limit: number; // 字节
  recycle_bin_days: number;
  backup_time: string; // HH:MM格式
  backup_day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
}
```

#### SmartAlbum

```typescript
export interface SmartAlbum {
  id: number;
  name: string;
  filter_json: string; // JSON格式的FilterCriteria
  created_at: string;
  updated_at: string;
}

export interface FilterCriteria {
  tags?: number[]; // tag IDs
  rating?: { min: number; max: number };
  date_range?: { start: string; end: string };
  format?: string[];
  is_favorite?: boolean;
  has_gps?: boolean;
  text_query?: string;
}
```

## 数据访问层

### DatabaseService接口

```typescript
export class DatabaseService {
  private db: Database.Database;
  
  constructor(dbPath: string) {
    this.db = new Database(dbPath, { verbose: console.log });
    this.initialize();
  }
  
  // Photos
  getPhotos(options?: {
    limit?: number;
    offset?: number;
    orderBy?: 'taken_at' | 'created_at' | 'rating';
    order?: 'ASC' | 'DESC';
    includeDeleted?: boolean;
  }): Photo[];
  
  getPhotoById(id: number): Photo | null;
  createPhoto(input: CreatePhotoInput): Photo;
  updatePhoto(input: UpdatePhotoInput): void;
  deletePhoto(id: number, soft?: boolean): void;
  restorePhoto(id: number): void;
  
  // Tags
  getAllTags(): Tag[];
  getTagById(id: number): Tag | null;
  createTag(input: CreateTagInput): Tag;
  updateTag(input: UpdateTagInput): void;
  deleteTag(id: number): void;
  
  // Photo-Tag关联
  addTagToPhoto(photoId: number, tagId: number): void;
  removeTagFromPhoto(photoId: number, tagId: number): void;
  getPhotoTags(photoId: number): Tag[];
  getPhotosWithTag(tagId: number): Photo[];
  
  // Albums
  getAllAlbums(): Album[];
  getAlbumById(id: number): Album | null;
  createAlbum(input: CreateAlbumInput): Album;
  updateAlbum(input: Partial<Album> & { id: number }): void;
  deleteAlbum(id: number): void;
  
  // Album-Photo关联
  addPhotoToAlbum(albumId: number, photoId: number, displayOrder?: number): void;
  removePhotoFromAlbum(albumId: number, photoId: number): void;
  getAlbumPhotos(albumId: number): Photo[];
  
  // Scan Jobs
  createScanJob(targetPath: string): ScanJob;
  updateScanJob(id: number, updates: Partial<ScanJob>): void;
  getScanJobs(limit?: number): ScanJob[];
  
  // Settings
  getSetting(key: string): string | null;
  setSetting(key: string, value: string): void;
  getAllSettings(): AppSettings;
  
  // Search
  searchPhotos(query: string): Photo[];
  searchPhotosByFilter(criteria: FilterCriteria): Photo[];
  
  // Statistics
  getPhotoCount(includeDeleted?: boolean): number;
  getTagStats(): Array<{ tag: Tag; count: number }>;
  getDatabaseSize(): number;
}
```

### 实现示例

```typescript
import Database from 'better-sqlite3';

export class DatabaseService {
  private db: Database.Database;
  
  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }
  
  getPhotos(options?: {
    limit?: number;
    offset?: number;
    orderBy?: 'taken_at' | 'created_at' | 'rating';
    order?: 'ASC' | 'DESC';
    includeDeleted?: boolean;
  }): Photo[] {
    const {
      limit = 100,
      offset = 0,
      orderBy = 'taken_at',
      order = 'DESC',
      includeDeleted = false
    } = options || {};
    
    let sql = 'SELECT * FROM photos';
    if (!includeDeleted) {
      sql += ' WHERE is_deleted = 0';
    }
    sql += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
    
    const stmt = this.db.prepare(sql);
    return stmt.all(limit, offset) as Photo[];
  }
  
  getPhotoById(id: number): Photo | null {
    const stmt = this.db.prepare('SELECT * FROM photos WHERE id = ?');
    return stmt.get(id) as Photo | null;
  }
  
  createPhoto(input: CreatePhotoInput): Photo {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO photos (
        file_path, file_name, file_size, file_hash, format,
        width, height, rating, is_favorite, is_deleted,
        created_at, updated_at, first_scanned_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?)
    `);
    
    const result = stmt.run(
      input.file_path,
      input.file_name,
      input.file_size,
      input.file_hash,
      input.format,
      input.width || null,
      input.height || null,
      now,
      now,
      now
    );
    
    return this.getPhotoById(result.lastInsertRowid as number)!;
  }
  
  updatePhoto(input: UpdatePhotoInput): void {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];
    
    if (input.title !== undefined) {
      fields.push('title = ?');
      values.push(input.title);
    }
    if (input.description !== undefined) {
      fields.push('description = ?');
      values.push(input.description);
    }
    if (input.rating !== undefined) {
      fields.push('rating = ?');
      values.push(input.rating);
    }
    if (input.is_favorite !== undefined) {
      fields.push('is_favorite = ?');
      values.push(input.is_favorite ? 1 : 0);
    }
    
    fields.push('updated_at = ?');
    values.push(now);
    values.push(input.id);
    
    const sql = `UPDATE photos SET ${fields.join(', ')} WHERE id = ?`;
    this.db.prepare(sql).run(...values);
  }
  
  deletePhoto(id: number, soft: boolean = true): void {
    if (soft) {
      const now = new Date().toISOString();
      this.db.prepare(`
        UPDATE photos 
        SET is_deleted = 1, deleted_at = ?, updated_at = ?
        WHERE id = ?
      `).run(now, now, id);
    } else {
      this.db.prepare('DELETE FROM photos WHERE id = ?').run(id);
    }
  }
  
  // 事务示例
  addTagsToPhoto(photoId: number, tagIds: number[]): void {
    const transaction = this.db.transaction((photoId: number, tagIds: number[]) => {
      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO photo_tags (photo_id, tag_id, created_at)
        VALUES (?, ?, ?)
      `);
      
      for (const tagId of tagIds) {
        stmt.run(photoId, tagId, now);
      }
      
      // 更新标签使用计数
      this.db.prepare(`
        UPDATE tags
        SET usage_count = (
          SELECT COUNT(*) FROM photo_tags WHERE tag_id = tags.id
        )
        WHERE id IN (${tagIds.join(',')})
      `).run();
    });
    
    transaction(photoId, tagIds);
  }
  
  // 全文搜索
  searchPhotos(query: string): Photo[] {
    // 假设已创建FTS5虚拟表photos_fts
    const stmt = this.db.prepare(`
      SELECT p.* FROM photos p
      INNER JOIN photos_fts fts ON p.id = fts.rowid
      WHERE photos_fts MATCH ?
      AND p.is_deleted = 0
      ORDER BY rank
    `);
    return stmt.all(query) as Photo[];
  }
}
```

## 数据验证

### 验证规则

```typescript
export class PhotoValidator {
  static validate(photo: Partial<Photo>): string[] {
    const errors: string[] = [];
    
    if (photo.file_path && photo.file_path.trim().length === 0) {
      errors.push('文件路径不能为空');
    }
    
    if (photo.file_hash && photo.file_hash.length !== 64) {
      errors.push('文件哈希必须是64字符的SHA-256值');
    }
    
    if (photo.rating !== undefined && (photo.rating < 0 || photo.rating > 5)) {
      errors.push('评分必须在0-5之间');
    }
    
    if (photo.is_deleted && !photo.deleted_at) {
      errors.push('已删除的图片必须有删除时间');
    }
    
    return errors;
  }
}

export class TagValidator {
  static validate(tag: Partial<Tag>): string[] {
    const errors: string[] = [];
    
    if (tag.name && tag.name.trim().length === 0) {
      errors.push('标签名称不能为空');
    }
    
    if (tag.name && tag.name.length > 50) {
      errors.push('标签名称不能超过50个字符');
    }
    
    if (tag.color && !/^#[0-9A-Fa-f]{6}$/.test(tag.color)) {
      errors.push('颜色必须是HEX格式(如#FF5733)');
    }
    
    return errors;
  }
}
```

## 数据库迁移

### 迁移机制

```typescript
export class MigrationManager {
  private db: Database.Database;
  
  constructor(db: Database.Database) {
    this.db = db;
  }
  
  getCurrentVersion(): number {
    try {
      const result = this.db.prepare(
        'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
      ).get() as { version: number } | undefined;
      return result?.version || 0;
    } catch {
      return 0;
    }
  }
  
  runMigrations(): void {
    const currentVersion = this.getCurrentVersion();
    const migrations = this.getMigrations();
    
    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        console.log(`Running migration ${migration.version}: ${migration.name}`);
        this.db.transaction(() => {
          migration.up(this.db);
          this.db.prepare(
            'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)'
          ).run(migration.version, new Date().toISOString());
        })();
      }
    }
  }
  
  private getMigrations(): Migration[] {
    return [
      {
        version: 1,
        name: 'initial_schema',
        up: (db) => {
          // 创建所有表...
          db.exec(`
            CREATE TABLE IF NOT EXISTS photos (...);
            CREATE TABLE IF NOT EXISTS tags (...);
            -- 其他表...
          `);
        }
      },
      // 后续迁移...
    ];
  }
}

interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}
```

## 性能优化

### 索引策略

与Tauri版本完全一致的索引:

```sql
-- 常用查询索引
CREATE INDEX IF NOT EXISTS idx_photos_file_hash ON photos(file_hash);
CREATE INDEX IF NOT EXISTS idx_photos_is_deleted ON photos(is_deleted);
CREATE INDEX IF NOT EXISTS idx_photos_is_favorite ON photos(is_favorite);
CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos(taken_at);
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag_id ON photo_tags(tag_id);

-- 复合索引优化
CREATE INDEX IF NOT EXISTS idx_photos_deleted_taken 
  ON photos(is_deleted, taken_at DESC);
```

### 查询优化技巧

```typescript
// 1. 使用预编译语句
const getPhotoStmt = db.prepare('SELECT * FROM photos WHERE id = ?');
for (const id of photoIds) {
  const photo = getPhotoStmt.get(id);
}

// 2. 批量操作使用事务
const insertMany = db.transaction((photos: CreatePhotoInput[]) => {
  const stmt = db.prepare('INSERT INTO photos (...) VALUES (...)');
  for (const photo of photos) {
    stmt.run(photo);
  }
});
insertMany(photos);

// 3. 使用WAL模式
db.pragma('journal_mode = WAL');

// 4. 调整缓存大小
db.pragma('cache_size = 10000'); // 10000页 ~40MB
```

## 数据完整性

### 级联规则

与Tauri版本一致:
- 删除photo → 级联删除photo_tags, album_photos, thumbnail_cache
- 删除tag → 级联删除photo_tags
- 删除album → 级联删除album_photos

### 软删除机制

```typescript
// 软删除
deletePhoto(id, true); // is_deleted = 1

// 恢复
restorePhoto(id: number): void {
  const now = new Date().toISOString();
  this.db.prepare(`
    UPDATE photos
    SET is_deleted = 0, deleted_at = NULL, updated_at = ?
    WHERE id = ?
  `).run(now, id);
}

// 永久删除(清理超过30天的)
cleanupRecycleBin(): number {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const result = this.db.prepare(`
    DELETE FROM photos
    WHERE is_deleted = 1 AND deleted_at < ?
  `).run(thirtyDaysAgo);
  return result.changes;
}
```

## 总结

Electron版本的数据模型设计原则:

1. **完全兼容**: 与Tauri版本数据库100%兼容
2. **类型安全**: TypeScript类型系统保证编译时检查
3. **性能优化**: better-sqlite3同步API + 预编译语句
4. **简洁实用**: 接口清晰,易于理解和维护

**关键差异**:
- 类型定义: Rust struct → TypeScript interface
- 数据访问: rusqlite → better-sqlite3
- 错误处理: Result<T, E> → try/catch
- 日期时间: chrono → ISO 8601 string

**兼容性保证**:
- SQL schema 100%一致
- 数据格式100%兼容
- 索引策略100%保持


