// T073: 扫描API调用
import { invoke, listen } from './tauri-adapter';

export interface ScanOptions {
  recursive: boolean;
  detect_duplicates: boolean;
}

export interface ScanProgress {
  total_files: number;
  processed_files: number;
  found_photos: number;
  current_path: string;
}

export interface ScannedPhoto {
  file_path: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  format: string;
  width?: number;
  height?: number;
}

export interface ScanResult {
  total_files: number;
  found_photos: number;
  duplicates_skipped: number;
  photos: ScannedPhoto[];
}

/**
 * 扫描文件夹
 */
export async function scanFolder(
  path: string,
  options: ScanOptions = { recursive: true, detect_duplicates: true }
): Promise<ScanResult> {
  return await invoke<ScanResult>('scan_folder', { path, options });
}

/**
 * 监听扫描进度
 */
export async function listenScanProgress(callback: (progress: ScanProgress) => void) {
  return await listen<ScanProgress>('scan_progress', callback);
}
