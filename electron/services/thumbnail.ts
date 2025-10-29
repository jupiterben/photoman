import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import { app } from 'electron';
import { BaseService } from './base-service';
import { createImageProcessingError } from '../utils/error-handler';

/**
 * 缩略图生成服务
 * 使用Sharp库生成和管理图片缩略图
 */
export class ThumbnailService extends BaseService {
  private cacheDir: string;

  // 缩略图尺寸配置
  private readonly sizes = {
    small: 200,
    medium: 400,
  };

  constructor() {
    super('ThumbnailService');
    // 缩略图缓存目录
    const userDataPath = app.getPath('userData');
    this.cacheDir = path.join(userDataPath, 'thumbnails');
  }

  /**
   * 初始化服务
   */
  protected async initializeService(): Promise<void> {
    // 创建缩略图缓存目录
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      this.logger?.info(`[Thumbnail] Cache directory initialized: ${this.cacheDir}`);
    } catch (error: any) {
      throw createImageProcessingError('Failed to create thumbnail cache directory', error, {
        cacheDir: this.cacheDir,
      });
    }

    // 配置Sharp缓存
    sharp.cache({ memory: 50, files: 20 });
  }

  /**
   * 生成单张缩略图
   */
  async generateThumbnail(photoPath: string, size: number = 200): Promise<Buffer> {
    try {
      const buffer = await sharp(photoPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'centre',
          withoutEnlargement: true, // 不放大小图
        })
        .jpeg({
          quality: 85,
          progressive: true, // 渐进式JPEG
        })
        .toBuffer();

      return buffer;
    } catch (error: any) {
      throw createImageProcessingError(`Failed to generate thumbnail for ${photoPath}`, error, {
        photoPath,
        size,
      });
    }
  }

  /**
   * 生成缩略图并保存到缓存
   */
  async generateAndCacheThumbnail(
    photoId: number,
    photoPath: string,
    sizeType: 'small' | 'medium' = 'small'
  ): Promise<string> {
    const size = this.sizes[sizeType];
    const cachePath = this.getCachePath(photoId, sizeType);

    // 检查缓存是否已存在
    try {
      await fs.access(cachePath);
      return cachePath; // 缓存存在，直接返回
    } catch {
      // 缓存不存在，生成新缩略图
    }

    try {
      // 生成缩略图
      const buffer = await this.generateThumbnail(photoPath, size);

      // 确保缓存目录存在
      const cacheSubDir = path.dirname(cachePath);
      await fs.mkdir(cacheSubDir, { recursive: true });

      // 保存到缓存
      await fs.writeFile(cachePath, buffer);

      this.logger?.debug(`[Thumbnail] Generated and cached: ${cachePath}`);
      return cachePath;
    } catch (error: any) {
      throw createImageProcessingError(
        `Failed to generate and cache thumbnail for photo ${photoId}`,
        error,
        { photoId, photoPath, sizeType }
      );
    }
  }

  /**
   * 批量生成缩略图
   */
  async generateThumbnailsBatch(
    photoPaths: string[],
    size: number = 200
  ): Promise<Map<string, Buffer>> {
    const results = new Map<string, Buffer>();

    // 限制并发数以避免内存爆炸
    const concurrency = 5;

    for (let i = 0; i < photoPaths.length; i += concurrency) {
      const batch = photoPaths.slice(i, i + concurrency);

      const batchResults = await Promise.allSettled(
        batch.map(async (path) => ({
          path,
          buffer: await this.generateThumbnail(path, size),
        }))
      );

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.set(result.value.path, result.value.buffer);
        } else {
          this.logger?.warn(`[Thumbnail] Failed to generate for batch item:`, result.reason);
        }
      });
    }

    return results;
  }

  /**
   * 获取缓存文件路径
   */
  private getCachePath(photoId: number, sizeType: 'small' | 'medium'): string {
    // 使用photoId的前两位作为子目录，避免单目录文件过多
    const subDir = String(photoId).padStart(6, '0').substring(0, 2);
    return path.join(this.cacheDir, subDir, `${photoId}_${sizeType}.jpg`);
  }

  /**
   * 删除指定图片的缓存
   */
  async deleteThumbnailCache(photoId: number): Promise<void> {
    try {
      const smallPath = this.getCachePath(photoId, 'small');
      const mediumPath = this.getCachePath(photoId, 'medium');

      await Promise.allSettled([fs.unlink(smallPath), fs.unlink(mediumPath)]);

      this.logger?.debug(`[Thumbnail] Deleted cache for photo ${photoId}`);
    } catch (error: any) {
      this.logger?.warn(`[Thumbnail] Failed to delete cache for photo ${photoId}:`, error.message);
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanupCache(daysOld: number = 30): Promise<number> {
    let deletedCount = 0;
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    try {
      const subDirs = await fs.readdir(this.cacheDir);

      for (const subDir of subDirs) {
        const subDirPath = path.join(this.cacheDir, subDir);
        const stat = await fs.stat(subDirPath);

        if (stat.isDirectory()) {
          const files = await fs.readdir(subDirPath);

          for (const file of files) {
            const filePath = path.join(subDirPath, file);
            const fileStat = await fs.stat(filePath);

            // 删除超过指定天数未访问的文件
            if (fileStat.atimeMs < cutoffTime) {
              await fs.unlink(filePath);
              deletedCount++;
            }
          }
        }
      }

      this.logger?.info(`[Thumbnail] Cleaned up ${deletedCount} old cache files`);
    } catch (error: any) {
      this.logger?.error('[Thumbnail] Failed to cleanup cache:', error);
    }

    return deletedCount;
  }

  /**
   * 获取缓存目录大小
   */
  async getCacheSize(): Promise<number> {
    let totalSize = 0;

    try {
      const calculateDirSize = async (dir: string): Promise<number> => {
        let size = 0;
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const entryPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            size += await calculateDirSize(entryPath);
          } else if (entry.isFile()) {
            const stat = await fs.stat(entryPath);
            size += stat.size;
          }
        }

        return size;
      };

      totalSize = await calculateDirSize(this.cacheDir);
    } catch (error: any) {
      this.logger?.error('[Thumbnail] Failed to calculate cache size:', error);
    }

    return totalSize;
  }

  /**
   * 清空所有缓存
   */
  async clearAllCache(): Promise<void> {
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
      await fs.mkdir(this.cacheDir, { recursive: true });
      this.logger?.info('[Thumbnail] All cache cleared');
    } catch (error: any) {
      this.logger?.error('[Thumbnail] Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * 获取logger引用
   */
  private get logger() {
    return require('../utils/logger').logger;
  }
}

// 导出单例
export const thumbnailService = new ThumbnailService();

