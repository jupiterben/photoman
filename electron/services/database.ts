import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
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

/**
 * 数据库服务
 * 使用better-sqlite3管理SQLite数据库
 */
export class DatabaseService extends BaseService {
  private db!: Database.Database;
  private dbPath: string;

  constructor() {
    super('DatabaseService');
    // 数据库路径
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'photoman.db');
  }

  /**
   * 初始化数据库连接
   */
  protected initializeService(): void {
    try {
      // 打开数据库连接
      this.db = new Database(this.dbPath);

      // 启用WAL模式（Write-Ahead Logging）提升性能
      this.db.pragma('journal_mode = WAL');

      // 启用外键约束
      this.db.pragma('foreign_keys = ON');

      // 增加缓存大小
      this.db.pragma('cache_size = 10000');

      // 验证数据库完整性
      this.verifyDatabase();
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
    if (this.db) {
      this.db.close();
    }
  }

  /**
   * 验证数据库表结构
   */
  private verifyDatabase(): void {
    // 检查核心表是否存在
    const tables = this.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as Array<{ name: string }>;

    const requiredTables = ['photos', 'tags', 'albums'];
    const existingTables = new Set(tables.map((t) => t.name));

    for (const table of requiredTables) {
      if (!existingTables.has(table)) {
        throw createDatabaseError(`Required table "${table}" does not exist in database`, undefined, {
          dbPath: this.dbPath,
        });
      }
    }
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

      let sql = 'SELECT * FROM photos';
      if (!includeDeleted) {
        sql += ' WHERE is_deleted = 0';
      }
      sql += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;

      const stmt = this.db.prepare(sql);
      return stmt.all(limit, offset) as Photo[];
    }) as unknown as Photo[];
  }

  /**
   * 根据ID获取图片
   */
  getPhotoById(id: number): Photo | null {
    this.ensureInitialized();

    const stmt = this.db.prepare('SELECT * FROM photos WHERE id = ?');
    return stmt.get(id) as Photo | null;
  }

  /**
   * 创建图片记录
   */
  createPhoto(input: CreatePhotoInput): Photo {
    this.ensureInitialized();

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

  /**
   * 更新图片信息
   */
  updatePhoto(input: UpdatePhotoInput): void {
    this.ensureInitialized();

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

  /**
   * 删除图片（支持软删除）
   */
  deletePhoto(id: number, soft: boolean = true): void {
    this.ensureInitialized();

    if (soft) {
      const now = new Date().toISOString();
      this.db
        .prepare(`
        UPDATE photos 
        SET is_deleted = 1, deleted_at = ?, updated_at = ?
        WHERE id = ?
      `)
        .run(now, now, id);
    } else {
      this.db.prepare('DELETE FROM photos WHERE id = ?').run(id);
    }
  }

  /**
   * 恢复已删除的图片
   */
  restorePhoto(id: number): void {
    this.ensureInitialized();

    const now = new Date().toISOString();
    this.db
      .prepare(`
        UPDATE photos
        SET is_deleted = 0, deleted_at = NULL, updated_at = ?
        WHERE id = ?
      `)
      .run(now, id);
  }

  /**
   * 获取图片数量
   */
  getPhotoCount(includeDeleted: boolean = false): number {
    this.ensureInitialized();

    let sql = 'SELECT COUNT(*) as count FROM photos';
    if (!includeDeleted) {
      sql += ' WHERE is_deleted = 0';
    }

    const result = this.db.prepare(sql).get() as { count: number };
    return result.count;
  }

  // ==================== Tags CRUD ====================

  /**
   * 获取所有标签
   */
  getAllTags(): Tag[] {
    this.ensureInitialized();

    return this.db.prepare('SELECT * FROM tags ORDER BY name').all() as Tag[];
  }

  /**
   * 根据ID获取标签
   */
  getTagById(id: number): Tag | null {
    this.ensureInitialized();

    return this.db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag | null;
  }

  /**
   * 创建标签
   */
  createTag(input: CreateTagInput): Tag {
    this.ensureInitialized();

    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO tags (name, color, parent_id, usage_count, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?)
    `);

    const result = stmt.run(input.name, input.color || null, input.parent_id || null, now, now);

    return this.getTagById(result.lastInsertRowid as number)!;
  }

  /**
   * 更新标签
   */
  updateTag(input: UpdateTagInput): void {
    this.ensureInitialized();

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      fields.push('name = ?');
      values.push(input.name);
    }
    if (input.color !== undefined) {
      fields.push('color = ?');
      values.push(input.color);
    }
    if (input.parent_id !== undefined) {
      fields.push('parent_id = ?');
      values.push(input.parent_id);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(input.id);

    const sql = `UPDATE tags SET ${fields.join(', ')} WHERE id = ?`;
    this.db.prepare(sql).run(...values);
  }

  /**
   * 删除标签
   */
  deleteTag(id: number): void {
    this.ensureInitialized();

    this.db.prepare('DELETE FROM tags WHERE id = ?').run(id);
  }

  // ==================== Photo-Tag Relations ====================

  /**
   * 为图片添加标签
   */
  addTagToPhoto(photoId: number, tagId: number): void {
    this.ensureInitialized();

    const now = new Date().toISOString();
    this.db
      .prepare(`
      INSERT OR IGNORE INTO photo_tags (photo_id, tag_id, created_at)
      VALUES (?, ?, ?)
    `)
      .run(photoId, tagId, now);

    // 更新标签使用计数
    this.db
      .prepare(`
      UPDATE tags
      SET usage_count = (SELECT COUNT(*) FROM photo_tags WHERE tag_id = ?)
      WHERE id = ?
    `)
      .run(tagId, tagId);
  }

  /**
   * 从图片移除标签
   */
  removeTagFromPhoto(photoId: number, tagId: number): void {
    this.ensureInitialized();

    this.db
      .prepare('DELETE FROM photo_tags WHERE photo_id = ? AND tag_id = ?')
      .run(photoId, tagId);

    // 更新标签使用计数
    this.db
      .prepare(`
      UPDATE tags
      SET usage_count = (SELECT COUNT(*) FROM photo_tags WHERE tag_id = ?)
      WHERE id = ?
    `)
      .run(tagId, tagId);
  }

  /**
   * 获取图片的所有标签
   */
  getPhotoTags(photoId: number): Tag[] {
    this.ensureInitialized();

    return this.db
      .prepare(`
        SELECT t.* FROM tags t
        INNER JOIN photo_tags pt ON t.id = pt.tag_id
        WHERE pt.photo_id = ?
        ORDER BY t.name
      `)
      .all(photoId) as Tag[];
  }

  /**
   * 获取包含指定标签的所有图片
   */
  getPhotosWithTag(tagId: number): Photo[] {
    this.ensureInitialized();

    return this.db
      .prepare(`
        SELECT p.* FROM photos p
        INNER JOIN photo_tags pt ON p.id = pt.photo_id
        WHERE pt.tag_id = ? AND p.is_deleted = 0
        ORDER BY p.taken_at DESC
      `)
      .all(tagId) as Photo[];
  }

  // ==================== Albums CRUD ====================

  /**
   * 获取所有相册
   */
  getAllAlbums(): Album[] {
    this.ensureInitialized();

    return this.db.prepare('SELECT * FROM albums ORDER BY created_at DESC').all() as Album[];
  }

  /**
   * 根据ID获取相册
   */
  getAlbumById(id: number): Album | null {
    this.ensureInitialized();

    return this.db.prepare('SELECT * FROM albums WHERE id = ?').get(id) as Album | null;
  }

  /**
   * 创建相册
   */
  createAlbum(input: CreateAlbumInput): Album {
    this.ensureInitialized();

    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO albums (name, description, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      input.name,
      input.description || null,
      input.sort_order || 'date_desc',
      now,
      now
    );

    return this.getAlbumById(result.lastInsertRowid as number)!;
  }

  /**
   * 更新相册
   */
  updateAlbum(input: Partial<Album> & { id: number }): void {
    this.ensureInitialized();

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      fields.push('name = ?');
      values.push(input.name);
    }
    if (input.description !== undefined) {
      fields.push('description = ?');
      values.push(input.description);
    }
    if (input.sort_order !== undefined) {
      fields.push('sort_order = ?');
      values.push(input.sort_order);
    }
    if (input.cover_photo_id !== undefined) {
      fields.push('cover_photo_id = ?');
      values.push(input.cover_photo_id);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(input.id);

    const sql = `UPDATE albums SET ${fields.join(', ')} WHERE id = ?`;
    this.db.prepare(sql).run(...values);
  }

  /**
   * 删除相册
   */
  deleteAlbum(id: number): void {
    this.ensureInitialized();

    this.db.prepare('DELETE FROM albums WHERE id = ?').run(id);
  }

  // ==================== Album-Photo Relations ====================

  /**
   * 将图片添加到相册
   */
  addPhotoToAlbum(albumId: number, photoId: number, displayOrder: number = 0): void {
    this.ensureInitialized();

    const now = new Date().toISOString();
    this.db
      .prepare(`
      INSERT OR IGNORE INTO album_photos (album_id, photo_id, display_order, added_at)
      VALUES (?, ?, ?, ?)
    `)
      .run(albumId, photoId, displayOrder, now);
  }

  /**
   * 从相册移除图片
   */
  removePhotoFromAlbum(albumId: number, photoId: number): void {
    this.ensureInitialized();

    this.db
      .prepare('DELETE FROM album_photos WHERE album_id = ? AND photo_id = ?')
      .run(albumId, photoId);
  }

  /**
   * 获取相册中的所有图片
   */
  getAlbumPhotos(albumId: number): Photo[] {
    this.ensureInitialized();

    return this.db
      .prepare(`
        SELECT p.* FROM photos p
        INNER JOIN album_photos ap ON p.id = ap.photo_id
        WHERE ap.album_id = ? AND p.is_deleted = 0
        ORDER BY ap.display_order, p.taken_at DESC
      `)
      .all(albumId) as Photo[];
  }

  // ==================== Settings ====================

  /**
   * 获取设置值
   */
  getSetting(key: string): string | null {
    this.ensureInitialized();

    const result = this.db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(key) as { value: string } | undefined;

    return result?.value || null;
  }

  /**
   * 设置值
   */
  setSetting(key: string, value: string): void {
    this.ensureInitialized();

    const now = new Date().toISOString();
    this.db
      .prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `)
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

    // 从数据库读取设置并合并
    const settings = this.db.prepare('SELECT key, value FROM settings').all() as Array<{
      key: string;
      value: string;
    }>;

    const result: any = { ...defaults };
    for (const { key, value } of settings) {
      if (key in defaults) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
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

    // TODO: 实现FTS5全文搜索
    // 暂时使用简单的LIKE搜索
    return this.db
      .prepare(`
        SELECT * FROM photos
        WHERE is_deleted = 0 AND (
          file_name LIKE ? OR
          title LIKE ? OR
          description LIKE ?
        )
        ORDER BY taken_at DESC
        LIMIT 100
      `)
      .all(`%${query}%`, `%${query}%`, `%${query}%`) as Photo[];
  }

  /**
   * 按筛选条件搜索图片
   */
  searchPhotosByFilter(criteria: FilterCriteria): Photo[] {
    this.ensureInitialized();

    // TODO: 实现复杂的筛选查询
    // 这是一个简化版本
    let sql = 'SELECT * FROM photos WHERE is_deleted = 0';
    const params: any[] = [];

    if (criteria.is_favorite !== undefined) {
      sql += ' AND is_favorite = ?';
      params.push(criteria.is_favorite ? 1 : 0);
    }

    if (criteria.rating) {
      sql += ' AND rating BETWEEN ? AND ?';
      params.push(criteria.rating.min, criteria.rating.max);
    }

    sql += ' ORDER BY taken_at DESC LIMIT 1000';

    return this.db.prepare(sql).all(...params) as Photo[];
  }

  // ==================== Scan Jobs ====================

  /**
   * 创建扫描任务
   */
  createScanJob(targetPath: string): ScanJob {
    this.ensureInitialized();

    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO scan_jobs (
        target_path, status, total_files, processed_files,
        found_photos, duplicates_skipped, started_at
      ) VALUES (?, 'running', 0, 0, 0, 0, ?)
    `);

    const result = stmt.run(targetPath, now);
    const id = result.lastInsertRowid as number;

    return this.db.prepare('SELECT * FROM scan_jobs WHERE id = ?').get(id) as ScanJob;
  }

  /**
   * 更新扫描任务
   */
  updateScanJob(id: number, updates: Partial<ScanJob>): void {
    this.ensureInitialized();

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
      if (updates.status !== 'running') {
        fields.push('finished_at = ?');
        values.push(new Date().toISOString());
      }
    }
    if (updates.total_files !== undefined) {
      fields.push('total_files = ?');
      values.push(updates.total_files);
    }
    if (updates.processed_files !== undefined) {
      fields.push('processed_files = ?');
      values.push(updates.processed_files);
    }
    if (updates.found_photos !== undefined) {
      fields.push('found_photos = ?');
      values.push(updates.found_photos);
    }
    if (updates.duplicates_skipped !== undefined) {
      fields.push('duplicates_skipped = ?');
      values.push(updates.duplicates_skipped);
    }
    if (updates.error_message !== undefined) {
      fields.push('error_message = ?');
      values.push(updates.error_message);
    }

    if (fields.length > 0) {
      values.push(id);
      const sql = `UPDATE scan_jobs SET ${fields.join(', ')} WHERE id = ?`;
      this.db.prepare(sql).run(...values);
    }
  }

  /**
   * 获取最近的扫描任务
   */
  getScanJobs(limit: number = 10): ScanJob[] {
    this.ensureInitialized();

    return this.db
      .prepare('SELECT * FROM scan_jobs ORDER BY started_at DESC LIMIT ?')
      .all(limit) as ScanJob[];
  }

  // ==================== Transaction Support ====================

  /**
   * 执行事务
   */
  transaction<T>(fn: () => T): T {
    this.ensureInitialized();

    const transaction = this.db.transaction(fn);
    return transaction();
  }
}

// ==================== Singleton Export ====================
export const databaseService = new DatabaseService();


