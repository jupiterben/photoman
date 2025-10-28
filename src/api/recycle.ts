// T144: 回收站 API 封装
import { invoke } from '@tauri-apps/api/core';

export interface RecycleBinStats {
  count: number;
  total_size: number;
  oldest_deleted: string | null;
}

export interface Photo {
  id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  width: number | null;
  height: number | null;
  format: string;
  title: string | null;
  description: string | null;
  rating: number;
  taken_at: string | null;
  camera_make: string | null;
  camera_model: string | null;
  lens_model: string | null;
  focal_length: number | null;
  aperture: number | null;
  shutter_speed: string | null;
  iso: number | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_altitude: number | null;
  is_favorite: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  first_scanned_at: string;
}

/**
 * 软删除照片（移至回收站）
 */
export async function softDeletePhotos(photoIds: number[]): Promise<number> {
  return await invoke<number>('soft_delete_photos', { photoIds });
}

/**
 * 恢复照片（从回收站恢复）
 */
export async function restorePhotos(photoIds: number[]): Promise<number> {
  return await invoke<number>('restore_photos', { photoIds });
}

/**
 * 永久删除照片
 */
export async function permanentlyDeletePhotos(photoIds: number[]): Promise<number> {
  return await invoke<number>('permanently_delete_photos', { photoIds });
}

/**
 * 获取回收站中的照片列表
 */
export async function getRecycleBinPhotos(): Promise<Photo[]> {
  return await invoke<Photo[]>('get_recycle_bin_photos');
}

/**
 * 清理过期的回收站项目
 * @param days 保留天数（默认 30 天）
 */
export async function cleanExpiredRecycleBin(days: number = 30): Promise<number> {
  return await invoke<number>('clean_expired_recycle_bin', { days });
}

/**
 * 清空整个回收站
 */
export async function emptyRecycleBin(): Promise<number> {
  return await invoke<number>('empty_recycle_bin');
}

/**
 * 获取回收站统计信息
 */
export async function getRecycleBinStats(): Promise<RecycleBinStats> {
  return await invoke<RecycleBinStats>('get_recycle_bin_stats');
}

