import chokidar, { FSWatcher } from 'chokidar';
import * as path from 'path';
import { BaseService } from './base-service';
import { scannerService } from './scanner';
import { databaseService } from './database';
import { BrowserWindow } from 'electron';

/**
 * 文件监控服务
 * 使用chokidar监控目录变化，自动处理新增和删除的图片
 */
export class WatcherService extends BaseService {
  private watchers = new Map<string, FSWatcher>();
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
    super('WatcherService');
  }

  /**
   * 初始化服务
   */
  protected initializeService(): void {
    // 监控服务不需要特殊初始化
  }

  /**
   * 清理服务
   */
  protected async cleanupService(): Promise<void> {
    await this.stopAll();
  }

  /**
   * 设置主窗口引用（用于发送事件）
   */
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * 判断是否为图片文件
   */
  private isImageFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.imageExtensions.has(ext);
  }

  /**
   * 启动目录监控
   */
  watchDirectory(dirPath: string): void {
    this.ensureInitialized();

    // 如果已经在监控，先停止
    if (this.watchers.has(dirPath)) {
      this.logger?.warn(`[Watcher] Directory ${dirPath} is already being watched`);
      return;
    }

    this.logger?.info(`[Watcher] Starting to watch directory: ${dirPath}`);

    const watcher = chokidar.watch(dirPath, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true,
      ignoreInitial: true, // 不触发初始扫描的事件
      awaitWriteFinish: {
        stabilityThreshold: 2000, // 文件写入稳定后2秒触发
        pollInterval: 100,
      },
      depth: 99, // 递归深度
    });

    watcher
      .on('add', (filePath) => this.handleNewFile(filePath))
      .on('unlink', (filePath) => this.handleDeletedFile(filePath))
      .on('error', (error) => {
        this.logger?.error(`[Watcher] Error watching ${dirPath}:`, error);
      })
      .on('ready', () => {
        this.logger?.info(`[Watcher] Initial scan complete for ${dirPath}`);
      });

    this.watchers.set(dirPath, watcher);
  }

  /**
   * 停止监控指定目录
   */
  async unwatchDirectory(dirPath: string): Promise<void> {
    const watcher = this.watchers.get(dirPath);

    if (watcher) {
      this.logger?.info(`[Watcher] Stopping watch on directory: ${dirPath}`);
      await watcher.close();
      this.watchers.delete(dirPath);
    }
  }

  /**
   * 停止所有监控
   */
  async stopAll(): Promise<void> {
    this.logger?.info('[Watcher] Stopping all watchers...');

    const closePromises = Array.from(this.watchers.values()).map((watcher) => watcher.close());

    await Promise.all(closePromises);
    this.watchers.clear();

    this.logger?.info('[Watcher] All watchers stopped');
  }

  /**
   * 获取当前监控的目录列表
   */
  getWatchedDirectories(): string[] {
    return Array.from(this.watchers.keys());
  }

  /**
   * 处理新文件
   */
  private async handleNewFile(filePath: string): Promise<void> {
    try {
      // 检查是否为图片文件
      if (!this.isImageFile(filePath)) {
        return;
      }

      this.logger?.info(`[Watcher] New image detected: ${filePath}`);

      // 确保数据库服务已初始化
      if (!databaseService.isInitialized()) {
        await databaseService.initialize();
      }

      // 使用ScannerService的方法处理单个文件
      const fs = require('fs/promises');
      const crypto = require('crypto');

      // 获取文件信息
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const format = path.extname(filePath).substring(1).toLowerCase();

      // 计算哈希
      const buffer = await fs.readFile(filePath);
      const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

      // 检查是否已存在
      const stmt = (databaseService as any).db.prepare(
        'SELECT id FROM photos WHERE file_hash = ? AND is_deleted = 0 LIMIT 1'
      );
      const existing = stmt.get(fileHash);

      if (existing) {
        this.logger?.debug(`[Watcher] Image already exists in database: ${filePath}`);
        return;
      }

      // 提取EXIF（如果可用）
      let exifData = null;
      try {
        const { exifService } = require('./exif');
        if (exifService.isInitialized() || (await exifService.initialize(), true)) {
          exifData = await exifService.extractExif(filePath);
        }
      } catch (error) {
        this.logger?.warn(`[Watcher] Failed to extract EXIF from ${filePath}:`, error);
      }

      // 创建图片记录
      const photo = databaseService.createPhoto({
        file_path: filePath,
        file_name: fileName,
        file_size: stats.size,
        file_hash: fileHash,
        format,
        width: exifData?.width,
        height: exifData?.height,
      });

      this.logger?.info(`[Watcher] Added new photo to database: ${fileName} (ID: ${photo.id})`);

      // 发送事件到前端
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('photo_added', photo);
      }
    } catch (error: any) {
      this.logger?.error(`[Watcher] Failed to handle new file ${filePath}:`, error);
    }
  }

  /**
   * 处理删除的文件
   */
  private async handleDeletedFile(filePath: string): Promise<void> {
    try {
      // 检查是否为图片文件
      if (!this.isImageFile(filePath)) {
        return;
      }

      this.logger?.info(`[Watcher] Image deleted: ${filePath}`);

      // 确保数据库服务已初始化
      if (!databaseService.isInitialized()) {
        await databaseService.initialize();
      }

      // 查找数据库中对应的图片
      const stmt = (databaseService as any).db.prepare(
        'SELECT id FROM photos WHERE file_path = ? AND is_deleted = 0'
      );
      const photo = stmt.get(filePath) as { id: number } | undefined;

      if (photo) {
        // 软删除
        databaseService.deletePhoto(photo.id, true);

        this.logger?.info(`[Watcher] Marked photo as deleted: ${filePath} (ID: ${photo.id})`);

        // 发送事件到前端
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('photo_deleted', { id: photo.id });
        }
      }
    } catch (error: any) {
      this.logger?.error(`[Watcher] Failed to handle deleted file ${filePath}:`, error);
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
export const watcherService = new WatcherService();

