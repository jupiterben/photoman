import type {
  Photo,
  Tag,
  Album,
  CreatePhotoInput,
  UpdatePhotoInput,
  CreateTagInput,
  UpdateTagInput,
  CreateAlbumInput,
  GetPhotosOptions,
  FilterCriteria,
  ScanProgress,
  AppSettings,
} from './index';

// ==================== IPC Command Registry ====================
// 定义所有IPC命令的名称、参数和返回值类型

export interface IPCCommandMap {
  // ===== Photos =====
  get_photos: {
    args: GetPhotosOptions;
    returns: Photo[];
  };
  get_photo_by_id: {
    args: { id: number };
    returns: Photo | null;
  };
  create_photo: {
    args: CreatePhotoInput;
    returns: Photo;
  };
  update_photo: {
    args: UpdatePhotoInput;
    returns: void;
  };
  delete_photo: {
    args: { id: number; soft?: boolean };
    returns: void;
  };
  restore_photo: {
    args: { id: number };
    returns: void;
  };
  get_photo_count: {
    args: { includeDeleted?: boolean };
    returns: number;
  };

  // ===== Tags =====
  get_all_tags: {
    args: void;
    returns: Tag[];
  };
  get_tag_by_id: {
    args: { id: number };
    returns: Tag | null;
  };
  create_tag: {
    args: CreateTagInput;
    returns: Tag;
  };
  update_tag: {
    args: UpdateTagInput;
    returns: void;
  };
  delete_tag: {
    args: { id: number };
    returns: void;
  };
  add_tag_to_photo: {
    args: { photoId: number; tagId: number };
    returns: void;
  };
  remove_tag_from_photo: {
    args: { photoId: number; tagId: number };
    returns: void;
  };
  get_photo_tags: {
    args: { photoId: number };
    returns: Tag[];
  };
  get_photos_with_tag: {
    args: { tagId: number };
    returns: Photo[];
  };

  // ===== Albums =====
  get_all_albums: {
    args: void;
    returns: Album[];
  };
  get_album_by_id: {
    args: { id: number };
    returns: Album | null;
  };
  create_album: {
    args: CreateAlbumInput;
    returns: Album;
  };
  update_album: {
    args: Partial<Album> & { id: number };
    returns: void;
  };
  delete_album: {
    args: { id: number };
    returns: void;
  };
  add_photo_to_album: {
    args: { albumId: number; photoId: number; displayOrder?: number };
    returns: void;
  };
  remove_photo_from_album: {
    args: { albumId: number; photoId: number };
    returns: void;
  };
  get_album_photos: {
    args: { albumId: number };
    returns: Photo[];
  };

  // ===== Scanning =====
  scan_folder: {
    args: { path: string };
    returns: { totalFiles: number; foundPhotos: number };
  };
  cancel_scan: {
    args: void;
    returns: void;
  };

  // ===== Search =====
  search_photos: {
    args: { query: string };
    returns: Photo[];
  };
  search_photos_by_filter: {
    args: FilterCriteria;
    returns: Photo[];
  };

  // ===== Settings =====
  get_setting: {
    args: { key: string };
    returns: string | null;
  };
  set_setting: {
    args: { key: string; value: string };
    returns: void;
  };
  get_all_settings: {
    args: void;
    returns: AppSettings;
  };

  // ===== Thumbnail =====
  generate_thumbnail: {
    args: { photoPath: string; size: number };
    returns: Buffer;
  };
  generate_thumbnails_batch: {
    args: { photoPaths: string[]; size: number };
    returns: Map<string, Buffer>;
  };

  // ===== File Watching =====
  watch_directory: {
    args: { dirPath: string };
    returns: void;
  };
  unwatch_directory: {
    args: { dirPath: string };
    returns: void;
  };

  // ===== System =====
  ping: {
    args: void;
    returns: string;
  };
  get_app_version: {
    args: void;
    returns: string;
  };
  select_folder: {
    args: void;
    returns: string | null;
  };
}

// ===== IPC Event Types =====
export interface IPCEvents {
  scan_progress: ScanProgress;
  photo_added: Photo;
  photo_deleted: { id: number };
  photo_updated: Photo;
}

// ===== Type Helpers =====
export type IPCCommand = keyof IPCCommandMap;
export type IPCCommandArgs<T extends IPCCommand> = IPCCommandMap[T]['args'];
export type IPCCommandReturns<T extends IPCCommand> = IPCCommandMap[T]['returns'];


