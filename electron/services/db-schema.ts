import { sqliteTable, integer, text, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Photos 表
 */
export const photos = sqliteTable(
  'photos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    file_path: text('file_path').notNull().unique(),
    file_name: text('file_name').notNull(),
    file_size: integer('file_size').notNull(),
    file_hash: text('file_hash').notNull(),
    width: integer('width'),
    height: integer('height'),
    format: text('format').notNull(),

    // EXIF 元数据
    title: text('title'),
    description: text('description'),
    rating: integer('rating').notNull().default(0),
    taken_at: text('taken_at'),
    camera_make: text('camera_make'),
    camera_model: text('camera_model'),
    lens_model: text('lens_model'),
    focal_length: real('focal_length'),
    aperture: real('aperture'),
    shutter_speed: text('shutter_speed'),
    iso: integer('iso'),
    gps_latitude: real('gps_latitude'),
    gps_longitude: real('gps_longitude'),
    gps_altitude: real('gps_altitude'),

    // 系统字段
    is_favorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
    is_deleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
    deleted_at: text('deleted_at'),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    first_scanned_at: text('first_scanned_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    filePathIdx: index('idx_photos_file_path').on(table.file_path),
    deletedAtIdx: index('idx_photos_deleted_at').on(table.deleted_at),
    takenAtIdx: index('idx_photos_taken_at').on(table.taken_at),
    ratingIdx: index('idx_photos_rating').on(table.rating),
    favoriteIdx: index('idx_photos_favorite').on(table.is_favorite),
  })
);

/**
 * Tags 表
 */
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color'),
  parent_id: integer('parent_id'),
  usage_count: integer('usage_count').notNull().default(0),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

/**
 * Albums 表
 */
export const albums = sqliteTable('albums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  cover_photo_id: integer('cover_photo_id').references(() => photos.id, {
    onDelete: 'set null',
  }),
  sort_order: text('sort_order', {
    enum: ['date_desc', 'date_asc', 'name', 'custom'],
  })
    .notNull()
    .default('date_desc'),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

/**
 * Photo-Tag 关联表
 */
export const photoTags = sqliteTable(
  'photo_tags',
  {
    photo_id: integer('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    tag_id: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    pk: index('pk_photo_tags').on(table.photo_id, table.tag_id),
    photoIdIdx: index('idx_photo_tags_photo_id').on(table.photo_id),
    tagIdIdx: index('idx_photo_tags_tag_id').on(table.tag_id),
  })
);

/**
 * Album-Photo 关联表
 */
export const albumPhotos = sqliteTable(
  'album_photos',
  {
    album_id: integer('album_id')
      .notNull()
      .references(() => albums.id, { onDelete: 'cascade' }),
    photo_id: integer('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    display_order: integer('display_order').notNull().default(0),
    added_at: text('added_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    pk: index('pk_album_photos').on(table.album_id, table.photo_id),
    albumIdIdx: index('idx_album_photos_album_id').on(table.album_id),
    photoIdIdx: index('idx_album_photos_photo_id').on(table.photo_id),
  })
);

/**
 * Settings 表
 */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

/**
 * Scan Jobs 表
 */
export const scanJobs = sqliteTable('scan_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  target_path: text('target_path').notNull(),
  status: text('status', { enum: ['running', 'completed', 'failed', 'cancelled'] })
    .notNull()
    .default('running'),
  total_files: integer('total_files').notNull().default(0),
  processed_files: integer('processed_files').notNull().default(0),
  found_photos: integer('found_photos').notNull().default(0),
  duplicates_skipped: integer('duplicates_skipped').notNull().default(0),
  error_message: text('error_message'),
  started_at: text('started_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  finished_at: text('finished_at'),
});

/**
 * 导出所有表
 */
export const schema = {
  photos,
  tags,
  albums,
  photoTags,
  albumPhotos,
  settings,
  scanJobs,
};
