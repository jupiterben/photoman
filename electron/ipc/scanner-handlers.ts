import { scannerService, thumbnailService, watcherService, searchService } from '../services';
import type { IPCCommand, IPCCommandArgs, IPCCommandReturns } from '../types/ipc-commands';

type RegisterHandlerFn = <T extends IPCCommand>(
  command: T,
  handler: (args: IPCCommandArgs<T>) => Promise<IPCCommandReturns<T>>
) => void;

/**
 * 注册所有扫描、监控、搜索相关的IPC命令
 */
export function registerScannerHandlers(registerHandler: RegisterHandlerFn) {
  console.log('[IPC] Registering scanner handlers...');

  // 确保服务已初始化
  if (!scannerService.isInitialized()) {
    scannerService.initialize().catch((error) => {
      console.error('[IPC] Failed to initialize scanner service:', error);
    });
  }

  if (!thumbnailService.isInitialized()) {
    thumbnailService.initialize().catch((error) => {
      console.error('[IPC] Failed to initialize thumbnail service:', error);
    });
  }

  if (!watcherService.isInitialized()) {
    watcherService.initialize().catch((error) => {
      console.error('[IPC] Failed to initialize watcher service:', error);
    });
  }

  if (!searchService.isInitialized()) {
    searchService.initialize().catch((error) => {
      console.error('[IPC] Failed to initialize search service:', error);
    });
  }

  // ===== Scanning =====
  registerHandler('scan_folder', async (args) => {
    return scannerService.scanFolder(args.path);
  });

  registerHandler('cancel_scan', async () => {
    scannerService.cancelScan();
  });

  // ===== Thumbnails =====
  registerHandler('generate_thumbnail', async (args) => {
    return thumbnailService.generateThumbnail(args.photoPath, args.size);
  });

  registerHandler('generate_thumbnails_batch', async (args) => {
    return thumbnailService.generateThumbnailsBatch(args.photoPaths, args.size);
  });

  // ===== File Watching =====
  registerHandler('watch_directory', async (args) => {
    watcherService.watchDirectory(args.dirPath);
  });

  registerHandler('unwatch_directory', async (args) => {
    await watcherService.unwatchDirectory(args.dirPath);
  });

  // ===== Search =====
  // search_photos已在database-handlers中注册
  registerHandler('search_photos_by_filter', async (args) => {
    return searchService.searchByFilter(args);
  });

  console.log('[IPC] Scanner handlers registered.');
}

