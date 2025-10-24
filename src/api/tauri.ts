/**
 * Tauri API wrapper for PhotoMan
 * This module provides type-safe wrappers around Tauri commands
 */

import { invoke } from '@tauri-apps/api/core';

// ==================== Error Types ====================

export interface AppError {
  code: string;
  message: string;
  details?: string;
}

export class PhotoManError extends Error {
  code: string;
  details?: string;

  constructor(error: AppError) {
    super(error.message);
    this.name = 'PhotoManError';
    this.code = error.code;
    this.details = error.details;
  }
}

/**
 * Helper function to handle Tauri command responses
 * Converts Rust errors to JavaScript PhotoManError
 */
async function invokeCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    // If the error is already an object with code/message, convert it
    if (typeof error === 'object' && error !== null && 'code' in error) {
      throw new PhotoManError(error as AppError);
    }
    // Otherwise, wrap the error message
    throw new PhotoManError({
      code: 'UNKNOWN_ERROR',
      message: String(error),
    });
  }
}

// ==================== Database API ====================

export interface DatabaseInfo {
  initialized: boolean;
  schema_version: number;
  path: string;
}

/**
 * Get database information and health status
 */
export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  return invokeCommand<DatabaseInfo>('get_database_info');
}

// ==================== General Commands ====================

/**
 * Greet command - for testing Tauri communication
 */
export async function greet(name: string): Promise<string> {
  return invokeCommand<string>('greet', { name });
}

// ==================== Future APIs ====================
// These will be implemented in later phases

// Photo Management
// export async function scanFolder(path: string): Promise<ScanJob>;
// export async function getPhotos(filters?: PhotoFilters): Promise<Photo[]>;
// export async function getPhotoById(id: number): Promise<Photo>;
// export async function updatePhoto(id: number, data: Partial<Photo>): Promise<Photo>;
// export async function deletePhoto(id: number): Promise<void>;

// Tag Management
// export async function getTags(): Promise<Tag[]>;
// export async function createTag(name: string, color?: string): Promise<Tag>;
// export async function addTagToPhoto(photoId: number, tagId: number): Promise<void>;
// export async function removeTagFromPhoto(photoId: number, tagId: number): Promise<void>;

// Album Management
// export async function getAlbums(): Promise<Album[]>;
// export async function createAlbum(name: string, description?: string): Promise<Album>;
// export async function addPhotoToAlbum(albumId: number, photoId: number): Promise<void>;
// export async function removePhotoFromAlbum(albumId: number, photoId: number): Promise<void>;

// Settings
// export async function getSettings(): Promise<Settings>;
// export async function updateSetting(key: string, value: string): Promise<void>;

