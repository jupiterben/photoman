import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and, desc, asc, like, or, sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { BaseService } from './base-service';
import {
  Photo,
  Tag,
  Album,
  CreatePhotoInput,
  UpdatePhotoInput,
  CreateTagInput,
  UpdateTagInput,
  CreateAlbumInput,
  GetPhotosOptions,
  FilterCriteria,
  AppSettings,
  ScanJob,
} from '../types';
import { createDatabaseError } from '../utils/error-handler';
import * as schema from './db-schema';

/**
 * 数据库服务
 * 使用 Drizzle ORM + better-sqlite3
 */
export class DatabaseService extends BaseService {
  private sqlite!: Database.Database;
  private db!: BetterSQLite3Database<typeof schema>;
  private dbPath: string;

  constructor() {
    super('DatabaseService');
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'photoman.db');
  }

  /**
   * 初始化数据库连接
   */
  protected initializeService(): void {
    try {
      // 打开数据库连接
      this.sqlite = new Database(this.dbPath);

      // 启用WAL模式（Write-Ahead Logging）提升性能
      this.sqlite.pragma('journal_mode = WAL');

      // 启用外键约束
      this.sqlite.pragma('foreign_keys = ON');

      // 增加缓存大小
      this.sqlite.pragma('cache_size = 10000');

      // 初始化 Drizzle ORM
      this.db = drizzle(this.sqlite, { schema });

      // 初始化表结构
      this.initializeTables();
    } catch (error) {
      throw createDatabaseError('Failed to initialize database', error as Error, {
        dbPath: this.dbPath,
      });
    }
  }

  /**
   * 清理数据库资源
   */
  protected cleanupService(): void {
    if (this.sqlite) {
      this.sqlite.close();
    }
  }

  /**
   * 初始化数据库表结构
   * 优先使用 Drizzle 迁移，降级到直接推送 schema
   */
  private initializeTables(): void {
    try {
      // 生产环境：尝试从打包后的迁移文件加载
      const migrationsFolder = path.join(__dirname, '../drizzle');

      try {
        migrate(this.db, { migrationsFolder });
        console.log(`[DatabaseService] ✓ Migrations applied from: ${migrationsFolder}`);
      } catch (migrationError) {
        console.log('[DatabaseService] No migrations folder found, falling back to push mode');
        // 降级：直接推送 schema
        this.pushSchema();
      }

      console.log(`[DatabaseService] ✓ Database initialized at: ${this.dbPath}`);
    } catch (error) {
      console.error('[DatabaseService] ✗ Failed to initialize tables:', error);
      throw error;
    }
  }

  /**
   * 直接推送 schema 到数据库
   * 等效于 drizzle-kit push，用于开发或迁移文件不存在时
   */
  private pushSchema(): void {
    const statements = [
      sql`CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_hash TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        format TEXT NOT NULL,
        title TEXT,
        description TEXT,
        rating INTEGER NOT NULL DEFAULT 0,
        taken_at TEXT,
        camera_make TEXT,
        camera_model TEXT,
        lens_model TEXT,
        focal_length REAL,
        aperture REAL,
        shutter_speed TEXT,
        iso INTEGER,
        gps_latitude REAL,
        gps_longitude REAL,
        gps_altitude REAL,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        first_scanned_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,

      sql`CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT,
        parent_id INTEGER,
        usage_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,

      sql`CREATE TABLE IF NOT EXISTS albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        cover_photo_id INTEGER REFERENCES photos(id) ON DELETE SET NULL,
        sort_order TEXT NOT NULL DEFAULT 'date_desc',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,

      sql`CREATE TABLE IF NOT EXISTS photo_tags (
        photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (photo_id, tag_id)
      )`,

      sql`CREATE TABLE IF NOT EXISTS album_photos (
        album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
        photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
        display_order INTEGER NOT NULL DEFAULT 0,
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (album_id, photo_id)
      )`,

      sql`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,

      sql`CREATE TABLE IF NOT EXISTS scan_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_path TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'running',
        total_files INTEGER NOT NULL DEFAULT 0,
        processed_files INTEGER NOT NULL DEFAULT 0,
        found_photos INTEGER NOT NULL DEFAULT 0,
        duplicates_skipped INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        finished_at TEXT
      )`,

      // 创建索引
      sql`CREATE INDEX IF NOT EXISTS idx_photos_file_path ON photos(file_path)`,
      sql`CREATE INDEX IF NOT EXISTS idx_photos_deleted_at ON photos(deleted_at)`,
      sql`CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos(taken_at)`,
      sql`CREATE INDEX IF NOT EXISTS idx_photos_rating ON photos(rating)`,
      sql`CREATE INDEX IF NOT EXISTS idx_photos_favorite ON photos(is_favorite)`,
      sql`CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id)`,
      sql`CREATE INDEX IF NOT EXISTS idx_photo_tags_tag_id ON photo_tags(tag_id)`,
      sql`CREATE INDEX IF NOT EXISTS idx_album_photos_album_id ON album_photos(album_id)`,
      sql`CREATE INDEX IF NOT EXISTS idx_album_photos_photo_id ON album_photos(photo_id)`,
    ];

    // 执行所有 SQL 语句
    for (const statement of statements) {
      this.db.run(statement);
    }

    console.log('[DatabaseService] ✓ Schema pushed to database');
  }

  // ==================== Photos CRUD ====================

  /**
   * 获取图片列表
   */
  getPhotos(options: GetPhotosOptions = {}): Photo[] {
    return this.wrapMethod('getPhotos', async () => {
      const {
        limit = 100,
        offset = 0,
        orderBy = 'taken_at',
        order = 'DESC',
        includeDeleted = false,
      } = options;

      const orderFn = order === 'DESC' ? desc : asc;
      const orderCol = schema.photos[orderBy] || schema.photos.taken_at;

      let query = this.db
        .select()
        .from(schema.photos)
        .orderBy(orderFn(orderCol))
        .limit(limit)
        .offset(offset);

      if (!includeDeleted) {
        query = query.where(eq(schema.photos.is_deleted, false)) as any;
      }

      return query.all() as Photo[];
    }) as unknown as Photo[];
  }

  /**
   * 根据ID获取图片
   */
  getPhotoById(id: number): Photo | null {
    this.ensureInitialized();

    const result = this.db.select().from(schema.photos).where(eq(schema.photos.id, id)).get();

    return (result as Photo) || null;
  }

  /**
   * 创建图片记录
   */
  createPhoto(input: CreatePhotoInput): Photo {
    this.ensureInitialized();

    const now = new Date().toISOString();
    const result = this.db
      .insert(schema.photos)
      .values({
        file_path: input.file_path,
        file_name: input.file_name,
        file_size: input.file_size,
        file_hash: input.file_hash,
        format: input.format,
        width: input.width || null,
        height: input.height || null,
        rating: 0,
        is_favorite: false,
        is_deleted: false,
        created_at: now,
        updated_at: now,
        first_scanned_at: now,
      })
      .returning()
      .get();

    return result as Photo;
  }

  /**
   * 更新图片信息
   */
  updatePhoto(input: UpdatePhotoInput): void {
    this.ensureInitialized();

    const now = new Date().toISOString();
    const updates: any = { updated_at: now };

    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.rating !== undefined) updates.rating = input.rating;
    if (input.is_favorite !== undefined) updates.is_favorite = input.is_favorite;

    this.db.update(schema.photos).set(updates).where(eq(schema.photos.id, input.id)).run();
  }

  /**
   * 删除图片（支持软删除）
   */
  deletePhoto(id: number, soft: boolean = true): void {
    this.ensureInitialized();

    if (soft) {
      const now = new Date().toISOString();
      this.db
        .update(schema.photos)
        .set({
          is_deleted: true,
          deleted_at: now,
          updated_at: now,
        })
        .where(eq(schema.photos.id, id))
        .run();
    } else {
      this.db.delete(schema.photos).where(eq(schema.photos.id, id)).run();
    }
  }

  /**
   * 恢复已删除的图片
   */
  restorePhoto(id: number): void {
    this.ensureInitialized();

    const now = new Date().toISOString();
    this.db
      .update(schema.photos)
      .set({
        is_deleted: false,
        deleted_at: null,
        updated_at: now,
      })
      .where(eq(schema.photos.id, id))
      .run();
  }

  /**
   * 获取图片数量
   */
  getPhotoCount(includeDeleted: boolean = false): number {
    this.ensureInitialized();

    let query = this.db.select({ count: sql<number>`count(*)` }).from(schema.photos);

    if (!includeDeleted) {
      query = query.where(eq(schema.photos.is_deleted, false)) as any;
    }

    const result = query.get() as { count: number };
    return result.count;
  }

  // ==================== Tags CRUD ====================

  /**
   * 获取所有标签
   */
  getAllTags(): Tag[] {
    this.ensureInitialized();

    return this.db.select().from(schema.tags).orderBy(asc(schema.tags.name)).all() as Tag[];
  }

  /**
   * 根据ID获取标签
   */
  getTagById(id: number): Tag | null {
    this.ensureInitialized();

    const result = this.db.select().from(schema.tags).where(eq(schema.tags.id, id)).get();

    return (result as Tag) || null;
  }

  /**
   * 创建标签
   */
  createTag(input: CreateTagInput): Tag {
    this.ensureInitialized();

    const now = new Date().toISOString();
    const result = this.db
      .insert(schema.tags)
      .values({
        name: input.name,
        color: input.color || null,
        parent_id: input.parent_id || null,
        usage_count: 0,
        created_at: now,
        updated_at: now,
      })
      .returning()
      .get();

    return result as Tag;
  }

  /**
   * 更新标签
   */
  updateTag(input: UpdateTagInput): void {
    this.ensureInitialized();

    const now = new Date().toISOString();
    const updates: any = { updated_at: now };

    if (input.name !== undefined) updates.name = input.name;
    if (input.color !== undefined) updates.color = input.color;
    if (input.parent_id !== undefined) updates.parent_id = input.parent_id;

    this.db.update(schema.tags).set(updates).where(eq(schema.tags.id, input.id)).run();
  }

  /**
   * 删除标签
   */
  deleteTag(id: number): void {
    this.ensureInitialized();

    this.db.delete(schema.tags).where(eq(schema.tags.id, id)).run();
  }

  // ==================== Photo-Tag Relations ====================

  /**
   * 为图片添加标签
   */
  addTagToPhoto(photoId: number, tagId: number): void {
    this.ensureInitialized();

    const now = new Date().toISOString();

    // 插入关联（忽略重复）
    try {
      this.db
        .insert(schema.photoTags)
        .values({
          photo_id: photoId,
          tag_id: tagId,
          created_at: now,
        })
        .run();
    } catch (error) {
      // 忽略唯一约束错误
    }

    // 更新标签使用计数
    this.db
      .update(schema.tags)
      .set({
        usage_count: sql`(SELECT COUNT(*) FROM ${schema.photoTags} WHERE tag_id = ${tagId})`,
      })
      .where(eq(schema.tags.id, tagId))
      .run();
  }

  /**
   * 从图片移除标签
   */
  removeTagFromPhoto(photoId: number, tagId: number): void {
    this.ensureInitialized();

    this.db
      .delete(schema.photoTags)
      .where(and(eq(schema.photoTags.photo_id, photoId), eq(schema.photoTags.tag_id, tagId)))
      .run();

    // 更新标签使用计数
    this.db
      .update(schema.tags)
      .set({
        usage_count: sql`(SELECT COUNT(*) FROM ${schema.photoTags} WHERE tag_id = ${tagId})`,
      })
      .where(eq(schema.tags.id, tagId))
      .run();
  }

  /**
   * 获取图片的所有标签
   */
  getPhotoTags(photoId: number): Tag[] {
    this.ensureInitialized();

    const result = this.db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
        color: schema.tags.color,
        parent_id: schema.tags.parent_id,
        usage_count: schema.tags.usage_count,
        created_at: schema.tags.created_at,
        updated_at: schema.tags.updated_at,
      })
      .from(schema.tags)
      .innerJoin(schema.photoTags, eq(schema.tags.id, schema.photoTags.tag_id))
      .where(eq(schema.photoTags.photo_id, photoId))
      .orderBy(asc(schema.tags.name))
      .all();

    return result as Tag[];
  }

  /**
   * 获取包含指定标签的所有图片
   */
  getPhotosWithTag(tagId: number): Photo[] {
    this.ensureInitialized();

    const result = this.db
      .select()
      .from(schema.photos)
      .innerJoin(schema.photoTags, eq(schema.photos.id, schema.photoTags.photo_id))
      .where(and(eq(schema.photoTags.tag_id, tagId), eq(schema.photos.is_deleted, false)))
      .orderBy(desc(schema.photos.taken_at))
      .all();

    return result.map((r: any) => r.photos) as Photo[];
  }

  // ==================== Albums CRUD ====================

  /**
   * 获取所有相册
   */
  getAllAlbums(): Album[] {
    this.ensureInitialized();

    return this.db
      .select()
      .from(schema.albums)
      .orderBy(desc(schema.albums.created_at))
      .all() as Album[];
  }

  /**
   * 根据ID获取相册
   */
  getAlbumById(id: number): Album | null {
    this.ensureInitialized();

    const result = this.db.select().from(schema.albums).where(eq(schema.albums.id, id)).get();

    return (result as Album) || null;
  }

  /**
   * 创建相册
   */
  createAlbum(input: CreateAlbumInput): Album {
    this.ensureInitialized();

    const now = new Date().toISOString();
    const result = this.db
      .insert(schema.albums)
      .values({
        name: input.name,
        description: input.description || null,
        sort_order: input.sort_order || 'date_desc',
        created_at: now,
        updated_at: now,
      })
      .returning()
      .get();

    return result as Album;
  }

  /**
   * 更新相册
   */
  updateAlbum(input: Partial<Album> & { id: number }): void {
    this.ensureInitialized();

    const now = new Date().toISOString();
    const updates: any = { updated_at: now };

    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.sort_order !== undefined) updates.sort_order = input.sort_order;
    if (input.cover_photo_id !== undefined) updates.cover_photo_id = input.cover_photo_id;

    this.db.update(schema.albums).set(updates).where(eq(schema.albums.id, input.id)).run();
  }

  /**
   * 删除相册
   */
  deleteAlbum(id: number): void {
    this.ensureInitialized();

    this.db.delete(schema.albums).where(eq(schema.albums.id, id)).run();
  }

  // ==================== Album-Photo Relations ====================

  /**
   * 将图片添加到相册
   */
  addPhotoToAlbum(albumId: number, photoId: number, displayOrder: number = 0): void {
    this.ensureInitialized();

    const now = new Date().toISOString();
    try {
      this.db
        .insert(schema.albumPhotos)
        .values({
          album_id: albumId,
          photo_id: photoId,
          display_order: displayOrder,
          added_at: now,
        })
        .run();
    } catch (error) {
      // 忽略唯一约束错误
    }
  }

  /**
   * 从相册移除图片
   */
  removePhotoFromAlbum(albumId: number, photoId: number): void {
    this.ensureInitialized();

    this.db
      .delete(schema.albumPhotos)
      .where(
        and(eq(schema.albumPhotos.album_id, albumId), eq(schema.albumPhotos.photo_id, photoId))
      )
      .run();
  }

  /**
   * 获取相册中的所有图片
   */
  getAlbumPhotos(albumId: number): Photo[] {
    this.ensureInitialized();

    const result = this.db
      .select()
      .from(schema.photos)
      .innerJoin(schema.albumPhotos, eq(schema.photos.id, schema.albumPhotos.photo_id))
      .where(and(eq(schema.albumPhotos.album_id, albumId), eq(schema.photos.is_deleted, false)))
      .orderBy(asc(schema.albumPhotos.display_order), desc(schema.photos.taken_at))
      .all();

    return result.map((r: any) => r.photos) as Photo[];
  }

  // ==================== Settings ====================

  /**
   * 获取设置值
   */
  getSetting(key: string): string | null {
    this.ensureInitialized();

    const result = this.db.select().from(schema.settings).where(eq(schema.settings.key, key)).get();

    return result ? (result as any).value : null;
  }

  /**
   * 设置值
   */
  setSetting(key: string, value: string): void {
    this.ensureInitialized();

    const now = new Date().toISOString();

    // 使用原生 SQL 实现 UPSERT
    this.sqlite
      .prepare(
        `
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `
      )
      .run(key, value, now, value, now);
  }

  /**
   * 获取所有设置
   */
  getAllSettings(): AppSettings {
    this.ensureInitialized();

    const defaults: AppSettings = {
      theme: 'system',
      language: 'zh-CN',
      cache_size_limit: 1024 * 1024 * 1024, // 1GB
      recycle_bin_days: 30,
      backup_time: '02:00',
      backup_day: 'sunday',
    };

    const allSettings = this.db.select().from(schema.settings).all();

    const result: any = { ...defaults };
    for (const setting of allSettings as any[]) {
      if (setting.key in defaults) {
        try {
          result[setting.key] = JSON.parse(setting.value);
        } catch {
          result[setting.key] = setting.value;
        }
      }
    }

    return result;
  }

  // ==================== Search ====================

  /**
   * 全文搜索图片
   */
  searchPhotos(query: string): Photo[] {
    this.ensureInitialized();

    const searchPattern = `%${query}%`;

    return this.db
      .select()
      .from(schema.photos)
      .where(
        and(
          eq(schema.photos.is_deleted, false),
          or(
            like(schema.photos.file_name, searchPattern),
            like(schema.photos.title, searchPattern),
            like(schema.photos.description, searchPattern)
          )
        )
      )
      .orderBy(desc(schema.photos.taken_at))
      .limit(100)
      .all() as Photo[];
  }

  /**
   * 按筛选条件搜索图片
   */
  searchPhotosByFilter(criteria: FilterCriteria): Photo[] {
    this.ensureInitialized();

    const conditions = [eq(schema.photos.is_deleted, false)];

    if (criteria.is_favorite !== undefined) {
      conditions.push(eq(schema.photos.is_favorite, criteria.is_favorite));
    }

    if (criteria.rating) {
      conditions.push(
        sql`${schema.photos.rating} BETWEEN ${criteria.rating.min} AND ${criteria.rating.max}`
      );
    }

    return this.db
      .select()
      .from(schema.photos)
      .where(and(...conditions))
      .orderBy(desc(schema.photos.taken_at))
      .limit(1000)
      .all() as Photo[];
  }

  // ==================== Scan Jobs ====================

  /**
   * 创建扫描任务
   */
  createScanJob(targetPath: string): ScanJob {
    this.ensureInitialized();

    const now = new Date().toISOString();
    const result = this.db
      .insert(schema.scanJobs)
      .values({
        target_path: targetPath,
        status: 'running',
        total_files: 0,
        processed_files: 0,
        found_photos: 0,
        duplicates_skipped: 0,
        started_at: now,
      })
      .returning()
      .get();

    return result as ScanJob;
  }

  /**
   * 更新扫描任务
   */
  updateScanJob(id: number, updates: Partial<ScanJob>): void {
    this.ensureInitialized();

    const values: any = {};

    if (updates.status !== undefined) {
      values.status = updates.status;
      if (updates.status !== 'running') {
        values.finished_at = new Date().toISOString();
      }
    }
    if (updates.total_files !== undefined) values.total_files = updates.total_files;
    if (updates.processed_files !== undefined) values.processed_files = updates.processed_files;
    if (updates.found_photos !== undefined) values.found_photos = updates.found_photos;
    if (updates.duplicates_skipped !== undefined)
      values.duplicates_skipped = updates.duplicates_skipped;
    if (updates.error_message !== undefined) values.error_message = updates.error_message;

    if (Object.keys(values).length > 0) {
      this.db.update(schema.scanJobs).set(values).where(eq(schema.scanJobs.id, id)).run();
    }
  }

  /**
   * 获取最近的扫描任务
   */
  getScanJobs(limit: number = 10): ScanJob[] {
    this.ensureInitialized();

    return this.db
      .select()
      .from(schema.scanJobs)
      .orderBy(desc(schema.scanJobs.started_at))
      .limit(limit)
      .all() as ScanJob[];
  }

  // ==================== Transaction Support ====================

  /**
   * 执行事务
   */
  transaction<T>(fn: () => T): T {
    this.ensureInitialized();

    return this.sqlite.transaction(fn)();
  }
}

// ==================== Singleton Export ====================
export const databaseService = new DatabaseService();
