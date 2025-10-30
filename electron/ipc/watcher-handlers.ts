/**
 * Watcher IPC Handlers
 * 处理监控目录相关的 IPC 通信
 */

/**
 * 注册监控目录相关的 IPC 处理器
 */
export function registerWatcherHandlers(registerHandler: any) {
  console.log('[IPC] Registering watcher handlers...');

  // T186: 添加监控目录
  registerHandler('add_watched_directory', async (args: { directoryPath: string; recursive: boolean }) => {
    // TODO: 实现添加监控目录逻辑
    // 暂时返回模拟数据
    console.log('[Watcher] Adding watched directory:', args);
    return Date.now(); // 返回 ID
  });

  // T187: 移除监控目录
  registerHandler('remove_watched_directory', async (args: { directoryId: number }) => {
    console.log('[Watcher] Removing watched directory:', args.directoryId);
    // TODO: 实现移除监控目录逻辑
  });

  // T188: 暂停监控目录
  registerHandler('pause_watched_directory', async (args: { directoryId: number }) => {
    console.log('[Watcher] Pausing watched directory:', args.directoryId);
    // TODO: 实现暂停监控目录逻辑
  });

  // T189: 恢复监控目录
  registerHandler('resume_watched_directory', async (args: { directoryId: number }) => {
    console.log('[Watcher] Resuming watched directory:', args.directoryId);
    // TODO: 实现恢复监控目录逻辑
  });

  // T190: 获取所有监控目录
  registerHandler('get_watched_directories', async () => {
    console.log('[Watcher] Getting all watched directories');
    // TODO: 实现获取监控目录列表逻辑
    return []; // 暂时返回空数组
  });

  // T191: 获取监控目录统计信息
  registerHandler('get_watched_directory_stats', async (args: { directoryId: number }) => {
    console.log('[Watcher] Getting stats for directory:', args.directoryId);
    // TODO: 实现获取统计信息逻辑
    return {
      id: args.directoryId,
      directory_path: '',
      status: 'active',
      photo_count: 0,
      active_photos: 0,
      deleted_photos: 0,
      last_synced_at: null,
      scan_count: 0,
      last_scan_at: null,
    };
  });

  // T191: 获取所有监控目录统计信息
  registerHandler('get_all_watched_directory_stats', async () => {
    console.log('[Watcher] Getting all watched directory stats');
    // TODO: 实现获取所有统计信息逻辑
    return []; // 暂时返回空数组
  });

  // T192: 重新扫描监控目录
  registerHandler('rescan_watched_directory', async (args: { directoryId: number }) => {
    console.log('[Watcher] Rescanning directory:', args.directoryId);
    // TODO: 实现重新扫描逻辑
  });

  // 获取监控器运行状态
  registerHandler('get_watcher_status', async () => {
    console.log('[Watcher] Getting watcher status');
    // TODO: 实现获取监控器状态逻辑
    return []; // 暂时返回空数组
  });

  console.log('[IPC] Watcher handlers registered.');
}

