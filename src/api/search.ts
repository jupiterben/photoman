// T129: 搜索API封装
import { invoke } from '@tauri-apps/api/core';

/**
 * 搜索查询参数
 */
export interface SearchQuery {
  keyword?: string;
  tag_ids?: number[];
  tag_mode?: 'any' | 'all';
  date_from?: number;
  date_to?: number;
  size_min?: number;
  size_max?: number;
  formats?: string[];
  width_min?: number;
  width_max?: number;
  height_min?: number;
  height_max?: number;
  is_favorite?: boolean;
  sort_by?: 'file_name' | 'file_size' | 'taken_at' | 'imported_at' | 'width' | 'height' | 'rating';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  photos: Photo[];
  total_count: number;
  has_more: boolean;
}

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
  camera_make?: string;
  camera_model?: string;
  lens_model?: string;
  focal_length?: number;
  aperture?: number;
  shutter_speed?: string;
  iso?: number;
  gps_latitude?: number;
  gps_longitude?: number;
  gps_altitude?: number;
  is_favorite: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  first_scanned_at: string;
}

/**
 * 高级搜索
 * @param query 搜索查询参数
 * @returns 搜索结果
 */
export async function searchPhotos(query: SearchQuery): Promise<SearchResult> {
  return await invoke('search_photos', { query });
}

/**
 * 快速搜索（仅文件名）
 * @param keyword 关键词
 * @param limit 返回数量限制
 * @returns 照片列表
 */
export async function quickSearchPhotos(keyword: string, limit?: number): Promise<Photo[]> {
  return await invoke('quick_search_photos', { keyword, limit: limit ?? 20 });
}



