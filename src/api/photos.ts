// T082: 图片列表API
// import { invoke } from '@tauri-apps/api/core';

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
 * 获取照片列表
 */
export async function getPhotos(_limit?: number, _offset?: number): Promise<Photo[]> {
  // TODO: 实现后端命令后取消注释
  // return await invoke<Photo[]>('get_photos', { limit, offset });

  // 临时返回空数组
  return [];
}

/**
 * 获取照片详情
 */
export async function getPhotoById(_id: number): Promise<Photo | null> {
  // TODO: 实现后端命令后取消注释
  // return await invoke<Photo | null>('get_photo_by_id', { id });

  return null;
}

/**
 * 更新照片信息
 */
export async function updatePhoto(_photo: Partial<Photo> & { id: number }): Promise<void> {
  // TODO: 实现后端命令
  // return await invoke('update_photo', { photo });
}

/**
 * 删除照片（软删除）
 */
export async function deletePhoto(_id: number): Promise<void> {
  // TODO: 实现后端命令
  // return await invoke('delete_photo', { id });
}
