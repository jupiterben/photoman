// Watched directory API
// T197: 实现监控目录 API 层

import { invoke } from './tauri-adapter';

/**
 * 监控目录实体
 */
export interface WatchedDirectory {
  id: number | null;
  directory_path: string;
  recursive: boolean;
  status: 'active' | 'paused' | 'error';
  photo_count: number;
  error_message: string | null;
  created_at: string;
  last_synced_at: string | null;
  updated_at: string;
}

/**
 * 监控目录统计信息
 */
export interface WatchedDirectoryStats {
  id: number;
  directory_path: string;
  status: string;
  photo_count: number;
  active_photos: number;
  deleted_photos: number;
  last_synced_at: string | null;
  scan_count: number;
  last_scan_at: string | null;
}

/**
 * 监控器状态
 */
export interface WatcherStatus {
  id: number;
  path: string;
  status: 'Running' | 'Paused' | 'Stopped' | { Error: string };
}

/**
 * 添加监控目录
 * T186: add_watched_directory
 */
export async function addWatchedDirectory(
  directoryPath: string,
  recursive: boolean = true
): Promise<number> {
  return await invoke<number>('add_watched_directory', {
    directoryPath,
    recursive,
  });
}

/**
 * 移除监控目录
 * T187: remove_watched_directory
 */
export async function removeWatchedDirectory(directoryId: number): Promise<void> {
  await invoke('remove_watched_directory', { directoryId });
}

/**
 * 暂停监控目录
 * T188: pause_watched_directory
 */
export async function pauseWatchedDirectory(directoryId: number): Promise<void> {
  await invoke('pause_watched_directory', { directoryId });
}

/**
 * 恢复监控目录
 * T189: resume_watched_directory
 */
export async function resumeWatchedDirectory(directoryId: number): Promise<void> {
  await invoke('resume_watched_directory', { directoryId });
}

/**
 * 获取所有监控目录
 * T190: get_watched_directories
 */
export async function getWatchedDirectories(): Promise<WatchedDirectory[]> {
  return await invoke<WatchedDirectory[]>('get_watched_directories');
}

/**
 * 获取监控目录统计信息
 * T191: get_watched_directory_stats
 */
export async function getWatchedDirectoryStats(
  directoryId: number
): Promise<WatchedDirectoryStats> {
  return await invoke<WatchedDirectoryStats>('get_watched_directory_stats', {
    directoryId,
  });
}

/**
 * 获取所有监控目录统计信息
 * T191: get_all_watched_directory_stats
 */
export async function getAllWatchedDirectoryStats(): Promise<WatchedDirectoryStats[]> {
  return await invoke<WatchedDirectoryStats[]>('get_all_watched_directory_stats');
}

/**
 * 重新扫描监控目录
 * T192: rescan_watched_directory
 */
export async function rescanWatchedDirectory(directoryId: number): Promise<void> {
  await invoke('rescan_watched_directory', { directoryId });
}

/**
 * 获取监控器运行状态
 */
export async function getWatcherStatus(): Promise<WatcherStatus[]> {
  return await invoke<WatcherStatus[]>('get_watcher_status');
}

