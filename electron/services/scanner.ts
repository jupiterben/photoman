import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { BaseService } from './base-service';
import { databaseService } from './database';
import { exifService } from './exif';
import type { ScanProgress, CreatePhotoInput } from '../types';
import { createFileSystemError, ErrorCode } from '../utils/error-handler';
import { BrowserWindow } from 'electron';

/**
 * 文件扫描服务
 * 负责目录遍历、图片识别、哈希计算、去重检测
 */
export class ScannerService extends BaseService {
  private cancelled: boolean = false;
  private currentScanJobId: number | null = null;
  private mainWindow: BrowserWindow | null = null;

  // 支持的图片格式
  private readonly imageExtensions = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.webp',
    '.tiff',
    '.tif',
    '.heic',
    '.heif',
    '.avif',
  ]);

  constructor() {
    super('ScannerService');
  }

  /**
   * 初始化服务
   */
  protected initializeService(): void {
    // 扫描服务不需要特殊初始化
  }

  /**
   * 设置主窗口引用（用于发送进度事件）
   */
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * 递归遍历目录
   */
  async walkDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (this.cancelled) break;

        const fullPath = path.join(dirPath, entry.name);

        try {
          if (entry.isDirectory()) {
            // 递归遍历子目录
            const subFiles = await this.walkDirectory(fullPath);
            files.push(...subFiles);
          } else if (entry.isFile()) {
            files.push(fullPath);
          }
        } catch (error: any) {
          // 跳过无法访问的文件/目录
          this.logger?.warn(`[Scanner] Cannot access ${fullPath}:`, error.message);
          continue;
        }
      }
    } catch (error: any) {
      throw createFileSystemError(
        `Failed to read directory: ${dirPath}`,
        ErrorCode.FS_READ_ERROR,
        error,
        { dirPath }
      );
    }

    return files;
  }

  /**
   * 判断是否为图片文件
   */
  isImageFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.imageExtensions.has(ext);
  }

  /**
   * 计算文件哈希
   */
  async calculateHash(filePath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(buffer).digest('hex');
    } catch (error: any) {
      throw createFileSystemError(
        `Failed to calculate hash for ${filePath}`,
        ErrorCode.FS_READ_ERROR,
        error,
        { filePath }
      );
    }
  }

  /**
   * 检查文件是否重复
   */
  async checkDuplicate(fileHash: string): Promise<boolean> {
    const existing = databaseService.getPhotos({
      limit: 1,
      includeDeleted: false,
    });

    // 简单查询，应该用专门的查询方法
    const stmt = (databaseService as any).db.prepare(
      'SELECT id FROM photos WHERE file_hash = ? AND is_deleted = 0 LIMIT 1'
    );
    const result = stmt.get(fileHash);
    return !!result;
  }

  /**
   * 报告扫描进度
   */
  private reportProgress(progress: ScanProgress) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('scan_progress', progress);
    }
  }

  /**
   * 主扫描流程
   */
  async scanFolder(folderPath: string): Promise<{ totalFiles: number; foundPhotos: number }> {
    return this.wrapMethod('scanFolder', async () => {
      // 重置取消标志
      this.cancelled = false;

      // 确保数据库服务已初始化
      if (!databaseService.isInitialized()) {
        await databaseService.initialize();
      }

      // 创建扫描任务记录
      const scanJob = databaseService.createScanJob(folderPath);
      this.currentScanJobId = scanJob.id;

      try {
        // 1. 遍历目录获取所有文件
        this.logger?.info(`[Scanner] Starting directory walk: ${folderPath}`);
        const allFiles = await this.walkDirectory(folderPath);

        if (this.cancelled) {
          databaseService.updateScanJob(scanJob.id, {
            status: 'cancelled',
            total_files: allFiles.length,
          });
          return { totalFiles: allFiles.length, foundPhotos: 0 };
        }

        // 2. 过滤出图片文件
        const imageFiles = allFiles.filter((file) => this.isImageFile(file));
        this.logger?.info(
          `[Scanner] Found ${imageFiles.length} image files out of ${allFiles.length} total files`
        );

        // 更新总文件数
        databaseService.updateScanJob(scanJob.id, {
          total_files: allFiles.length,
        });

        // 3. 处理每个图片文件
        let foundPhotos = 0;
        let duplicatesSkipped = 0;

        for (let i = 0; i < imageFiles.length; i++) {
          if (this.cancelled) break;

          const filePath = imageFiles[i];

          try {
            // 获取文件信息
            const stats = await fs.stat(filePath);
            const fileName = path.basename(filePath);
            const format = path.extname(filePath).substring(1).toLowerCase();

            // 计算哈希
            const fileHash = await this.calculateHash(filePath);

            // 检查重复
            const isDuplicate = await this.checkDuplicate(fileHash);

            if (isDuplicate) {
              duplicatesSkipped++;
              this.logger?.debug(`[Scanner] Skipping duplicate: ${filePath}`);
            } else {
              // 提取EXIF信息
              let exifData = null;
              try {
                exifData = await exifService.extractExif(filePath);
              } catch (error) {
                this.logger?.warn(`[Scanner] Failed to extract EXIF from ${filePath}:`, error);
              }

              // 创建图片记录
              const photoInput: CreatePhotoInput = {
                file_path: filePath,
                file_name: fileName,
                file_size: stats.size,
                file_hash: fileHash,
                format,
                width: exifData?.width,
                height: exifData?.height,
              };

              const photo = databaseService.createPhoto(photoInput);

              // 如果有EXIF数据，更新图片信息
              if (exifData) {
                databaseService.updatePhoto({
                  id: photo.id,
                  title: exifData.title,
                  description: exifData.description,
                });

                // 更新EXIF字段（需要直接SQL更新）
                // TODO: 在DatabaseService中添加updatePhotoExif方法
              }

              foundPhotos++;
            }

            // 报告进度
            const processed = i + 1;
            this.reportProgress({
              total_files: imageFiles.length,
              processed_files: processed,
              found_photos: foundPhotos,
              current_file: fileName,
            });

            // 更新扫描任务进度
            databaseService.updateScanJob(scanJob.id, {
              processed_files: processed,
              found_photos: foundPhotos,
              duplicates_skipped: duplicatesSkipped,
            });
          } catch (error: any) {
            this.logger?.error(`[Scanner] Failed to process ${filePath}:`, error);
            // 继续处理下一个文件
          }
        }

        // 完成扫描
        databaseService.updateScanJob(scanJob.id, {
          status: this.cancelled ? 'cancelled' : 'completed',
          processed_files: imageFiles.length,
          found_photos: foundPhotos,
          duplicates_skipped: duplicatesSkipped,
        });

        this.logger?.info(
          `[Scanner] Scan completed. Found ${foundPhotos} new photos, skipped ${duplicatesSkipped} duplicates`
        );

        return { totalFiles: allFiles.length, foundPhotos };
      } catch (error: any) {
        // 扫描失败
        databaseService.updateScanJob(scanJob.id, {
          status: 'failed',
          error_message: error.message || 'Unknown error',
        });

        throw error;
      } finally {
        this.currentScanJobId = null;
      }
    }) as Promise<{ totalFiles: number; foundPhotos: number }>;
  }

  /**
   * 取消当前扫描
   */
  cancelScan(): void {
    if (this.currentScanJobId) {
      this.cancelled = true;
      this.logger?.info('[Scanner] Scan cancellation requested');
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
export const scannerService = new ScannerService();

