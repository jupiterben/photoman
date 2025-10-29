// ==================== Photo Types ====================
export interface Photo {
  id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  width: number | null;
  height: number | null;
  format: string;

  // EXIF元数据
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

  // 系统字段
  is_favorite: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  first_scanned_at: string;
}

export interface CreatePhotoInput {
  file_path: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  format: string;
  width?: number;
  height?: number;
}

export interface UpdatePhotoInput {
  id: number;
  title?: string;
  description?: string;
  rating?: number;
  is_favorite?: boolean;
}

// ==================== Tag Types ====================
export interface Tag {
  id: number;
  name: string;
  color: string | null;
  parent_id: number | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTagInput {
  name: string;
  color?: string;
  parent_id?: number;
}

export interface UpdateTagInput {
  id: number;
  name?: string;
  color?: string;
  parent_id?: number;
}

// ==================== Album Types ====================
export interface Album {
  id: number;
  name: string;
  description: string | null;
  cover_photo_id: number | null;
  sort_order: 'date_desc' | 'date_asc' | 'name' | 'custom';
  created_at: string;
  updated_at: string;
}

export interface CreateAlbumInput {
  name: string;
  description?: string;
  sort_order?: 'date_desc' | 'date_asc' | 'name' | 'custom';
}

// ==================== Scan Job Types ====================
export interface ScanJob {
  id: number;
  target_path: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  total_files: number;
  processed_files: number;
  found_photos: number;
  duplicates_skipped: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface ScanProgress {
  total_files: number;
  processed_files: number;
  found_photos: number;
  current_file: string;
}

// ==================== Settings Types ====================
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  cache_size_limit: number;
  recycle_bin_days: number;
  backup_time: string;
  backup_day: string;
}

// ==================== Search Types ====================
export interface FilterCriteria {
  tags?: number[];
  rating?: { min: number; max: number };
  date_range?: { start: string; end: string };
  format?: string[];
  is_favorite?: boolean;
  has_gps?: boolean;
  text_query?: string;
}

export interface SmartAlbum {
  id: number;
  name: string;
  filter_json: string;
  created_at: string;
  updated_at: string;
}

// ==================== EXIF Types ====================
export interface ExifData {
  takenAt?: Date;
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  focalLength?: number;
  aperture?: number;
  shutterSpeed?: string;
  iso?: number;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
}

// ==================== Thumbnail Types ====================
export interface ThumbnailCache {
  id: number;
  photo_id: number;
  size_type: 'small' | 'medium';
  cache_path: string;
  file_size: number;
  generated_at: string;
  last_accessed_at: string;
}

// ==================== Database Query Options ====================
export interface GetPhotosOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'taken_at' | 'created_at' | 'rating';
  order?: 'ASC' | 'DESC';
  includeDeleted?: boolean;
}


