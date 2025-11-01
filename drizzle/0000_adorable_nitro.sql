CREATE TABLE `album_photos` (
	`album_id` integer NOT NULL,
	`photo_id` integer NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`added_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pk_album_photos` ON `album_photos` (`album_id`,`photo_id`);--> statement-breakpoint
CREATE INDEX `idx_album_photos_album_id` ON `album_photos` (`album_id`);--> statement-breakpoint
CREATE INDEX `idx_album_photos_photo_id` ON `album_photos` (`photo_id`);--> statement-breakpoint
CREATE TABLE `albums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`cover_photo_id` integer,
	`sort_order` text DEFAULT 'date_desc' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`cover_photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `photo_tags` (
	`photo_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pk_photo_tags` ON `photo_tags` (`photo_id`,`tag_id`);--> statement-breakpoint
CREATE INDEX `idx_photo_tags_photo_id` ON `photo_tags` (`photo_id`);--> statement-breakpoint
CREATE INDEX `idx_photo_tags_tag_id` ON `photo_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_path` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`file_hash` text NOT NULL,
	`width` integer,
	`height` integer,
	`format` text NOT NULL,
	`title` text,
	`description` text,
	`rating` integer DEFAULT 0 NOT NULL,
	`taken_at` text,
	`camera_make` text,
	`camera_model` text,
	`lens_model` text,
	`focal_length` real,
	`aperture` real,
	`shutter_speed` text,
	`iso` integer,
	`gps_latitude` real,
	`gps_longitude` real,
	`gps_altitude` real,
	`is_favorite` integer DEFAULT false NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`first_scanned_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photos_file_path_unique` ON `photos` (`file_path`);--> statement-breakpoint
CREATE INDEX `idx_photos_file_path` ON `photos` (`file_path`);--> statement-breakpoint
CREATE INDEX `idx_photos_deleted_at` ON `photos` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `idx_photos_taken_at` ON `photos` (`taken_at`);--> statement-breakpoint
CREATE INDEX `idx_photos_rating` ON `photos` (`rating`);--> statement-breakpoint
CREATE INDEX `idx_photos_favorite` ON `photos` (`is_favorite`);--> statement-breakpoint
CREATE TABLE `scan_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`target_path` text NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`total_files` integer DEFAULT 0 NOT NULL,
	`processed_files` integer DEFAULT 0 NOT NULL,
	`found_photos` integer DEFAULT 0 NOT NULL,
	`duplicates_skipped` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`started_at` text DEFAULT (datetime('now')) NOT NULL,
	`finished_at` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`parent_id` integer,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);