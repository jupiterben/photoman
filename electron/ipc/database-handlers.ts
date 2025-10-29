import { databaseService } from '../services';
import type { IPCCommand, IPCCommandArgs, IPCCommandReturns } from '../types/ipc-commands';

type RegisterHandlerFn = <T extends IPCCommand>(
  command: T,
  handler: (args: IPCCommandArgs<T>) => Promise<IPCCommandReturns<T>>
) => void;

/**
 * 注册所有数据库相关的IPC命令
 */
export function registerDatabaseHandlers(registerHandler: RegisterHandlerFn) {
  console.log('[IPC] Registering database handlers...');

  // 确保数据库服务已初始化
  if (!databaseService.isInitialized()) {
    databaseService.initialize().catch((error) => {
      console.error('[IPC] Failed to initialize database service:', error);
    });
  }

  // ===== Photos =====
  registerHandler('get_photos', async (args) => {
    return databaseService.getPhotos(args);
  });

  registerHandler('get_photo_by_id', async (args) => {
    return databaseService.getPhotoById(args.id);
  });

  registerHandler('create_photo', async (args) => {
    return databaseService.createPhoto(args);
  });

  registerHandler('update_photo', async (args) => {
    databaseService.updatePhoto(args);
  });

  registerHandler('delete_photo', async (args) => {
    databaseService.deletePhoto(args.id, args.soft);
  });

  registerHandler('restore_photo', async (args) => {
    databaseService.restorePhoto(args.id);
  });

  registerHandler('get_photo_count', async (args) => {
    return databaseService.getPhotoCount(args?.includeDeleted);
  });

  // ===== Tags =====
  registerHandler('get_all_tags', async () => {
    return databaseService.getAllTags();
  });

  registerHandler('get_tag_by_id', async (args) => {
    return databaseService.getTagById(args.id);
  });

  registerHandler('create_tag', async (args) => {
    return databaseService.createTag(args);
  });

  registerHandler('update_tag', async (args) => {
    databaseService.updateTag(args);
  });

  registerHandler('delete_tag', async (args) => {
    databaseService.deleteTag(args.id);
  });

  registerHandler('add_tag_to_photo', async (args) => {
    databaseService.addTagToPhoto(args.photoId, args.tagId);
  });

  registerHandler('remove_tag_from_photo', async (args) => {
    databaseService.removeTagFromPhoto(args.photoId, args.tagId);
  });

  registerHandler('get_photo_tags', async (args) => {
    return databaseService.getPhotoTags(args.photoId);
  });

  registerHandler('get_photos_with_tag', async (args) => {
    return databaseService.getPhotosWithTag(args.tagId);
  });

  // ===== Albums =====
  registerHandler('get_all_albums', async () => {
    return databaseService.getAllAlbums();
  });

  registerHandler('get_album_by_id', async (args) => {
    return databaseService.getAlbumById(args.id);
  });

  registerHandler('create_album', async (args) => {
    return databaseService.createAlbum(args);
  });

  registerHandler('update_album', async (args) => {
    databaseService.updateAlbum(args);
  });

  registerHandler('delete_album', async (args) => {
    databaseService.deleteAlbum(args.id);
  });

  registerHandler('add_photo_to_album', async (args) => {
    databaseService.addPhotoToAlbum(args.albumId, args.photoId, args.displayOrder);
  });

  registerHandler('remove_photo_from_album', async (args) => {
    databaseService.removePhotoFromAlbum(args.albumId, args.photoId);
  });

  registerHandler('get_album_photos', async (args) => {
    return databaseService.getAlbumPhotos(args.albumId);
  });

  // ===== Search =====
  registerHandler('search_photos', async (args) => {
    return databaseService.searchPhotos(args.query);
  });

  registerHandler('search_photos_by_filter', async (args) => {
    return databaseService.searchPhotosByFilter(args);
  });

  // ===== Settings =====
  registerHandler('get_setting', async (args) => {
    return databaseService.getSetting(args.key);
  });

  registerHandler('set_setting', async (args) => {
    databaseService.setSetting(args.key, args.value);
  });

  registerHandler('get_all_settings', async () => {
    return databaseService.getAllSettings();
  });

  console.log('[IPC] Database handlers registered.');
}


