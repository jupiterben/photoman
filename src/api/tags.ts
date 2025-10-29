// T109: 标签API封装
import { invoke } from './tauri-adapter';

export interface Tag {
  id?: number;
  name: string;
  color?: string;
  parent_id?: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TagStats {
  total_tags: number;
  used_tags: number;
  unused_tags: number;
  total_associations: number;
}

// 标签管理
export async function createTag(name: string, color?: string): Promise<number> {
  return invoke('create_tag', { name, color });
}

export async function getAllTags(): Promise<Tag[]> {
  return invoke('get_all_tags');
}

export async function searchTags(query: string, limit?: number): Promise<Tag[]> {
  return invoke('search_tags', { query, limit });
}

export async function getMostUsedTags(limit?: number): Promise<Tag[]> {
  return invoke('get_most_used_tags', { limit });
}

export async function updateTag(id: number, name?: string, color?: string): Promise<void> {
  return invoke('update_tag', { id, name, color });
}

export async function deleteTag(id: number): Promise<void> {
  return invoke('delete_tag', { id });
}

export async function getTagStats(): Promise<TagStats> {
  return invoke('get_tag_stats');
}

// 照片-标签关联
export async function addTagToPhoto(photoId: number, tagId: number): Promise<void> {
  return invoke('add_tag_to_photo', { photoId, tagId });
}

export async function addTagToPhotos(photoIds: number[], tagId: number): Promise<number> {
  return invoke('add_tag_to_photos', { photoIds, tagId });
}

export async function removeTagFromPhoto(photoId: number, tagId: number): Promise<void> {
  return invoke('remove_tag_from_photo', { photoId, tagId });
}

export async function removeTagFromPhotos(photoIds: number[], tagId: number): Promise<number> {
  return invoke('remove_tag_from_photos', { photoIds, tagId });
}

export async function getPhotoTags(photoId: number): Promise<Tag[]> {
  return invoke('get_photo_tags', { photoId });
}

export async function getPhotosByTag(tagId: number): Promise<number[]> {
  return invoke('get_photos_by_tag', { tagId });
}

export async function getPhotosByAnyTags(tagIds: number[]): Promise<number[]> {
  return invoke('get_photos_by_any_tags', { tagIds });
}

export async function getPhotosByAllTags(tagIds: number[]): Promise<number[]> {
  return invoke('get_photos_by_all_tags', { tagIds });
}
