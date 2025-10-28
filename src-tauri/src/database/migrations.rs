// Database migrations
use rusqlite::Connection;

pub struct Migration {
    pub version: i32,
    pub name: &'static str,
    pub up: fn(&Connection) -> Result<(), rusqlite::Error>,
}

/// Get all migrations in order
pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            name: "initial_schema",
            up: migration_001_initial_schema,
        },
        Migration {
            version: 2,
            name: "optimize_search_performance",
            up: migration_002_optimize_search,
        },
        Migration {
            version: 3,
            name: "add_watched_directories",
            up: migration_003_add_watched_directories,
        },
    ]
}

/// Migration 001: Initial schema
/// Creates all tables and indexes
fn migration_001_initial_schema(conn: &Connection) -> Result<(), rusqlite::Error> {
    log::info!("Running migration 001: initial_schema");

    conn.execute_batch(
        "
        -- ==================== Schema Migrations Table ====================
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL
        );

        -- ==================== Photos Table ====================
        CREATE TABLE photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL UNIQUE,
            file_name TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            file_hash TEXT NOT NULL,
            width INTEGER,
            height INTEGER,
            format TEXT NOT NULL,
            
            -- EXIF metadata
            title TEXT,
            description TEXT,
            rating INTEGER DEFAULT 0,
            taken_at TEXT,
            camera_make TEXT,
            camera_model TEXT,
            lens_model TEXT,
            focal_length REAL,
            aperture REAL,
            shutter_speed TEXT,
            iso INTEGER,
            gps_latitude REAL,
            gps_longitude REAL,
            gps_altitude REAL,
            
            -- System fields
            is_favorite BOOLEAN DEFAULT 0,
            is_deleted BOOLEAN DEFAULT 0,
            deleted_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            first_scanned_at TEXT NOT NULL,
            
            CONSTRAINT chk_rating CHECK (rating >= 0 AND rating <= 5),
            CONSTRAINT chk_deleted CHECK (
                (is_deleted = 0 AND deleted_at IS NULL) OR 
                (is_deleted = 1 AND deleted_at IS NOT NULL)
            )
        );

        -- Photos indexes
        CREATE INDEX idx_photos_file_hash ON photos(file_hash);
        CREATE INDEX idx_photos_file_path ON photos(file_path);
        CREATE INDEX idx_photos_is_deleted ON photos(is_deleted);
        CREATE INDEX idx_photos_is_favorite ON photos(is_favorite);
        CREATE INDEX idx_photos_taken_at ON photos(taken_at);
        CREATE INDEX idx_photos_format ON photos(format);
        CREATE INDEX idx_photos_rating ON photos(rating);

        -- ==================== Tags Table ====================
        CREATE TABLE tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT,
            parent_id INTEGER,
            usage_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            
            FOREIGN KEY (parent_id) REFERENCES tags(id) ON DELETE SET NULL
        );

        -- Tags indexes
        CREATE INDEX idx_tags_name ON tags(name);
        CREATE INDEX idx_tags_parent_id ON tags(parent_id);

        -- ==================== Albums Table ====================
        CREATE TABLE albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            cover_photo_id INTEGER,
            sort_order TEXT DEFAULT 'date_desc',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            
            FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL,
            CONSTRAINT chk_sort_order CHECK (sort_order IN ('date_desc', 'date_asc', 'name', 'custom'))
        );

        -- Albums indexes
        CREATE INDEX idx_albums_name ON albums(name);

        -- ==================== Photo Tags Association Table ====================
        CREATE TABLE photo_tags (
            photo_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            
            PRIMARY KEY (photo_id, tag_id),
            FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );

        -- Photo tags indexes
        CREATE INDEX idx_photo_tags_photo_id ON photo_tags(photo_id);
        CREATE INDEX idx_photo_tags_tag_id ON photo_tags(tag_id);

        -- ==================== Album Photos Association Table ====================
        CREATE TABLE album_photos (
            album_id INTEGER NOT NULL,
            photo_id INTEGER NOT NULL,
            display_order INTEGER,
            created_at TEXT NOT NULL,
            
            PRIMARY KEY (album_id, photo_id),
            FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
            FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
        );

        -- Album photos indexes
        CREATE INDEX idx_album_photos_album_id ON album_photos(album_id);
        CREATE INDEX idx_album_photos_photo_id ON album_photos(photo_id);
        CREATE INDEX idx_album_photos_display_order ON album_photos(album_id, display_order);

        -- ==================== Scan Jobs Table ====================
        CREATE TABLE scan_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_path TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'running',
            total_files INTEGER DEFAULT 0,
            processed_files INTEGER DEFAULT 0,
            found_photos INTEGER DEFAULT 0,
            duplicates_skipped INTEGER DEFAULT 0,
            error_message TEXT,
            started_at TEXT NOT NULL,
            finished_at TEXT,
            
            CONSTRAINT chk_status CHECK (status IN ('running', 'completed', 'failed', 'cancelled'))
        );

        -- Scan jobs indexes
        CREATE INDEX idx_scan_jobs_status ON scan_jobs(status);
        CREATE INDEX idx_scan_jobs_started_at ON scan_jobs(started_at);

        -- ==================== Thumbnail Cache Table ====================
        CREATE TABLE thumbnail_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            photo_id INTEGER NOT NULL,
            size_type TEXT NOT NULL,
            cache_path TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            generated_at TEXT NOT NULL,
            last_accessed_at TEXT NOT NULL,
            
            UNIQUE(photo_id, size_type),
            FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
            CONSTRAINT chk_size_type CHECK (size_type IN ('small', 'medium'))
        );

        -- Thumbnail cache indexes
        CREATE INDEX idx_thumbnail_cache_photo_id ON thumbnail_cache(photo_id);
        CREATE INDEX idx_thumbnail_cache_last_accessed ON thumbnail_cache(last_accessed_at);

        -- ==================== Settings Table ====================
        CREATE TABLE settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        -- Insert default settings
        INSERT INTO settings (key, value, updated_at) VALUES
            ('theme', 'system', datetime('now')),
            ('language', 'zh-CN', datetime('now')),
            ('cache_size_limit', '5368709120', datetime('now')),
            ('recycle_bin_days', '30', datetime('now')),
            ('backup_time', '02:00', datetime('now')),
            ('backup_day', 'sunday', datetime('now'));

        -- ==================== Smart Albums Table ====================
        CREATE TABLE smart_albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            filter_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        -- Smart albums indexes
        CREATE INDEX idx_smart_albums_name ON smart_albums(name);

        -- ==================== Record Migration ====================
        INSERT INTO schema_migrations (version, name, applied_at)
        VALUES (1, 'initial_schema', datetime('now'));
        ",
    )?;

    log::info!("Migration 001 completed successfully");
    Ok(())
}

/// Apply all pending migrations
pub fn run_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    log::info!("Checking for pending migrations...");

    // Get current version
    let current_version = get_current_version(conn)?;
    log::info!("Current schema version: {}", current_version);

    let migrations = get_migrations();
    let pending: Vec<&Migration> = migrations
        .iter()
        .filter(|m| m.version > current_version)
        .collect();

    if pending.is_empty() {
        log::info!("No pending migrations");
        return Ok(());
    }

    log::info!("Found {} pending migration(s)", pending.len());

    for migration in pending {
        log::info!(
            "Applying migration {}: {}",
            migration.version,
            migration.name
        );
        (migration.up)(conn)?;
        log::info!(
            "Migration {} applied successfully",
            migration.version
        );
    }

    log::info!("All migrations completed");
    Ok(())
}

/// Get the current schema version
fn get_current_version(conn: &Connection) -> Result<i32, rusqlite::Error> {
    // Check if schema_migrations table exists
    let table_exists: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='schema_migrations'",
        [],
        |row| row.get(0),
    )?;

    if table_exists == 0 {
        return Ok(0);
    }

    // Get the latest version
    let version: Result<i32, rusqlite::Error> = conn.query_row(
        "SELECT MAX(version) FROM schema_migrations",
        [],
        |row| row.get(0),
    );

    match version {
        Ok(v) => Ok(v),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(0),
        Err(e) => Err(e),
    }
}
/// Migration 002: T121 - Optimize search performance
/// Adds composite indexes and full-text search capabilities
fn migration_002_optimize_search(conn: &Connection) -> Result<(), rusqlite::Error> {
    log::info!("Running migration 002: optimize_search_performance");

    conn.execute_batch(
        "
        -- ==================== Search Performance Optimization ====================
        
        -- Composite index for common search queries (file name + deleted flag)
        CREATE INDEX IF NOT EXISTS idx_photos_search_name 
            ON photos(is_deleted, file_name COLLATE NOCASE);
        
        -- Composite index for date range searches
        CREATE INDEX IF NOT EXISTS idx_photos_search_date 
            ON photos(is_deleted, taken_at DESC);
        
        -- Composite index for size filtering
        CREATE INDEX IF NOT EXISTS idx_photos_search_size 
            ON photos(is_deleted, file_size);
        
        -- Composite index for format + deleted
        CREATE INDEX IF NOT EXISTS idx_photos_search_format 
            ON photos(is_deleted, format);
        
        -- Composite index for favorite + deleted
        CREATE INDEX IF NOT EXISTS idx_photos_search_favorite 
            ON photos(is_deleted, is_favorite, first_scanned_at DESC);
        
        -- Composite index for rating searches
        CREATE INDEX IF NOT EXISTS idx_photos_search_rating 
            ON photos(is_deleted, rating DESC, first_scanned_at DESC);
        
        -- Full-text search virtual table for file names and metadata
        CREATE VIRTUAL TABLE IF NOT EXISTS photos_fts USING fts5(
            file_name,
            title,
            description,
            content=photos,
            content_rowid=id
        );
        
        -- Populate FTS table with existing data
        INSERT INTO photos_fts(rowid, file_name, title, description)
        SELECT id, file_name, title, description FROM photos WHERE is_deleted = 0;
        
        -- Triggers to keep FTS table in sync
        CREATE TRIGGER IF NOT EXISTS photos_fts_insert AFTER INSERT ON photos BEGIN
            INSERT INTO photos_fts(rowid, file_name, title, description)
            VALUES (new.id, new.file_name, new.title, new.description);
        END;
        
        CREATE TRIGGER IF NOT EXISTS photos_fts_update AFTER UPDATE ON photos BEGIN
            UPDATE photos_fts 
            SET file_name = new.file_name, 
                title = new.title, 
                description = new.description
            WHERE rowid = new.id;
        END;
        
        CREATE TRIGGER IF NOT EXISTS photos_fts_delete AFTER DELETE ON photos BEGIN
            DELETE FROM photos_fts WHERE rowid = old.id;
        END;
        
        -- ==================== Tag Search Optimization ====================
        
        -- Composite index for tag search performance
        CREATE INDEX IF NOT EXISTS idx_photo_tags_search 
            ON photo_tags(tag_id, photo_id);
        
        -- ==================== Record Migration ====================
        INSERT INTO schema_migrations (version, name, applied_at)
        VALUES (2, 'optimize_search_performance', datetime('now'));
        ",
    )?;

    log::info!("Migration 002 completed successfully");
    Ok(())
}

/// Migration 003: T173 - Add watched directories
/// Creates watched_directories table for real-time directory monitoring
fn migration_003_add_watched_directories(conn: &Connection) -> Result<(), rusqlite::Error> {
    log::info!("Running migration 003: add_watched_directories");

    conn.execute_batch(
        "
        -- ==================== Watched Directories Table ====================
        
        CREATE TABLE IF NOT EXISTS watched_directories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            directory_path TEXT NOT NULL UNIQUE,
            recursive BOOLEAN NOT NULL DEFAULT 1,
            status TEXT NOT NULL DEFAULT 'active',
            photo_count INTEGER NOT NULL DEFAULT 0,
            error_message TEXT,
            created_at TEXT NOT NULL,
            last_synced_at TEXT,
            updated_at TEXT NOT NULL,
            
            CONSTRAINT chk_status CHECK (status IN ('active', 'paused', 'error')),
            CONSTRAINT chk_photo_count CHECK (photo_count >= 0),
            CONSTRAINT chk_error CHECK (
                (status = 'error' AND error_message IS NOT NULL) OR
                (status != 'error')
            )
        );

        -- Watched directories indexes
        CREATE INDEX IF NOT EXISTS idx_watched_directories_status 
            ON watched_directories(status);
        CREATE INDEX IF NOT EXISTS idx_watched_directories_path 
            ON watched_directories(directory_path);
        CREATE INDEX IF NOT EXISTS idx_watched_directories_last_synced 
            ON watched_directories(last_synced_at);

        -- Add watched_directory_id to scan_jobs table (optional, for tracking)
        ALTER TABLE scan_jobs ADD COLUMN watched_directory_id INTEGER 
            REFERENCES watched_directories(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_scan_jobs_watched_dir 
            ON scan_jobs(watched_directory_id);

        -- Add watched_directory_id to photos table (for tracking source)
        ALTER TABLE photos ADD COLUMN watched_directory_id INTEGER 
            REFERENCES watched_directories(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_photos_watched_dir 
            ON photos(watched_directory_id);
        
        -- ==================== Record Migration ====================
        INSERT INTO schema_migrations (version, name, applied_at)
        VALUES (3, 'add_watched_directories', datetime('now'));
        ",
    )?;

    log::info!("Migration 003 completed successfully");
    Ok(())
}

