import { BaseService } from './base-service';
import { databaseService } from './database';
import type { Photo, FilterCriteria } from '../types';

/**
 * 搜索服务
 * 提供复杂的图片搜索和筛选功能
 */
export class SearchService extends BaseService {
  constructor() {
    super('SearchService');
  }

  /**
   * 初始化服务
   */
  protected initializeService(): void {
    // 搜索服务不需要特殊初始化
  }

  /**
   * 按筛选条件搜索图片
   */
  searchByFilter(criteria: FilterCriteria): Photo[] {
    this.ensureInitialized();

    // 确保数据库服务已初始化
    if (!databaseService.isInitialized()) {
      throw new Error('DatabaseService must be initialized before searching');
    }

    let sql = 'SELECT * FROM photos WHERE is_deleted = 0';
    const params: any[] = [];
    const conditions: string[] = [];

    // 收藏状态
    if (criteria.is_favorite !== undefined) {
      conditions.push('is_favorite = ?');
      params.push(criteria.is_favorite ? 1 : 0);
    }

    // 评分范围
    if (criteria.rating) {
      conditions.push('rating BETWEEN ? AND ?');
      params.push(criteria.rating.min, criteria.rating.max);
    }

    // 日期范围
    if (criteria.date_range) {
      conditions.push('taken_at BETWEEN ? AND ?');
      params.push(criteria.date_range.start, criteria.date_range.end);
    }

    // 格式过滤
    if (criteria.format && criteria.format.length > 0) {
      const formatPlaceholders = criteria.format.map(() => '?').join(',');
      conditions.push(`format IN (${formatPlaceholders})`);
      params.push(...criteria.format);
    }

    // GPS信息
    if (criteria.has_gps !== undefined) {
      if (criteria.has_gps) {
        conditions.push('(gps_latitude IS NOT NULL AND gps_longitude IS NOT NULL)');
      } else {
        conditions.push('(gps_latitude IS NULL OR gps_longitude IS NULL)');
      }
    }

    // 标签筛选（需要JOIN）
    if (criteria.tags && criteria.tags.length > 0) {
      const tagPlaceholders = criteria.tags.map(() => '?').join(',');
      sql = `
        SELECT DISTINCT p.* FROM photos p
        INNER JOIN photo_tags pt ON p.id = pt.photo_id
        WHERE p.is_deleted = 0 AND pt.tag_id IN (${tagPlaceholders})
      `;
      params.unshift(...criteria.tags);
    }

    // 添加其他条件
    if (conditions.length > 0) {
      if (criteria.tags && criteria.tags.length > 0) {
        sql += ` AND ${conditions.join(' AND ')}`;
      } else {
        sql += ` AND ${conditions.join(' AND ')}`;
      }
    }

    // 文本查询（简单实现）
    if (criteria.text_query) {
      const textCondition = `(
        file_name LIKE ? OR
        title LIKE ? OR
        description LIKE ?
      )`;
      sql += conditions.length > 0 || (criteria.tags && criteria.tags.length > 0) ? ` AND ${textCondition}` : ` AND ${textCondition}`;
      const queryPattern = `%${criteria.text_query}%`;
      params.push(queryPattern, queryPattern, queryPattern);
    }

    // 排序
    sql += ' ORDER BY taken_at DESC LIMIT 1000';

    const stmt = (databaseService as any).db.prepare(sql);
    return stmt.all(...params) as Photo[];
  }

  /**
   * 执行智能相册查询
   */
  executeSmartAlbum(filterJson: string): Photo[] {
    this.ensureInitialized();

    try {
      const criteria: FilterCriteria = JSON.parse(filterJson);
      return this.searchByFilter(criteria);
    } catch (error: any) {
      this.logger?.error('[Search] Failed to parse smart album filter:', error);
      throw new Error('Invalid smart album filter JSON');
    }
  }

  /**
   * 全文搜索（使用DatabaseService）
   */
  fullTextSearch(query: string): Photo[] {
    this.ensureInitialized();

    // 确保数据库服务已初始化
    if (!databaseService.isInitialized()) {
      throw new Error('DatabaseService must be initialized before searching');
    }

    return databaseService.searchPhotos(query);
  }

  /**
   * 按相机型号搜索
   */
  searchByCamera(cameraMake?: string, cameraModel?: string): Photo[] {
    this.ensureInitialized();

    let sql = 'SELECT * FROM photos WHERE is_deleted = 0';
    const params: any[] = [];
    const conditions: string[] = [];

    if (cameraMake) {
      conditions.push('camera_make = ?');
      params.push(cameraMake);
    }

    if (cameraModel) {
      conditions.push('camera_model = ?');
      params.push(cameraModel);
    }

    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY taken_at DESC LIMIT 1000';

    const stmt = (databaseService as any).db.prepare(sql);
    return stmt.all(...params) as Photo[];
  }

  /**
   * 按拍摄参数搜索
   */
  searchByShootingParams(options: {
    minAperture?: number;
    maxAperture?: number;
    minIso?: number;
    maxIso?: number;
    minFocalLength?: number;
    maxFocalLength?: number;
  }): Photo[] {
    this.ensureInitialized();

    let sql = 'SELECT * FROM photos WHERE is_deleted = 0';
    const params: any[] = [];
    const conditions: string[] = [];

    if (options.minAperture !== undefined) {
      conditions.push('aperture >= ?');
      params.push(options.minAperture);
    }

    if (options.maxAperture !== undefined) {
      conditions.push('aperture <= ?');
      params.push(options.maxAperture);
    }

    if (options.minIso !== undefined) {
      conditions.push('iso >= ?');
      params.push(options.minIso);
    }

    if (options.maxIso !== undefined) {
      conditions.push('iso <= ?');
      params.push(options.maxIso);
    }

    if (options.minFocalLength !== undefined) {
      conditions.push('focal_length >= ?');
      params.push(options.minFocalLength);
    }

    if (options.maxFocalLength !== undefined) {
      conditions.push('focal_length <= ?');
      params.push(options.maxFocalLength);
    }

    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY taken_at DESC LIMIT 1000';

    const stmt = (databaseService as any).db.prepare(sql);
    return stmt.all(...params) as Photo[];
  }

  /**
   * 获取logger引用
   */
  private get logger() {
    return require('../utils/logger').logger;
  }
}

// 导出单例
export const searchService = new SearchService();

