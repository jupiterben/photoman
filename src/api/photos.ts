// T082: 图片列表API
import { invoke } from './tauri-adapter';

export interface Photo {
  id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  width?: number;
  height?: number;
  format: string;
  title?: string;
  description?: string;
  rating: number;
  taken_at?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 照片更新请求参数
 */
export interface UpdatePhotoRequest {
  id: number;
  title?: string;
  description?: string;
  rating?: number;
  is_favorite?: boolean;
}

/**
 * 获取照片列表
 */
export async function getPhotos(limit?: number, offset?: number): Promise<Photo[]> {
  return await invoke<Photo[]>('get_photos', { limit, offset });
}

/**
 * 获取照片详情
 */
export async function getPhotoById(id: number): Promise<Photo | null> {
  return await invoke<Photo | null>('get_photo_by_id', { id });
}

/**
 * 更新照片信息
 */
export async function updatePhoto(request: UpdatePhotoRequest): Promise<void> {
  return await invoke('update_photo', { request });
}

/**
 * 删除照片（软删除）
 */
export async function deletePhoto(id: number): Promise<void> {
  return await invoke('delete_photo', { id });
}

/**
 * 获取照片总数
 */
export async function getPhotosCount(includeDeleted?: boolean): Promise<number> {
  return await invoke<number>('get_photos_count', { includeDeleted });
}
