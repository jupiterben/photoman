// Integration tests for database initialization
use std::path::PathBuf;
use std::fs;

// Helper function to get temp database path
fn get_temp_db_path() -> PathBuf {
    let mut path = std::env::temp_dir();
    path.push(format!(
        "photoman_integration_test_{}.db",
        chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)
    ));
    path
}

// Helper function to cleanup database files
fn cleanup_db(path: &PathBuf) {
    let _ = fs::remove_file(path);
    let _ = fs::remove_file(format!("{}-wal", path.display()));
    let _ = fs::remove_file(format!("{}-shm", path.display()));
}

#[test]
fn test_database_full_initialization() {
    // This test simulates the full database initialization process
    // that happens when the application starts

    let db_path = get_temp_db_path();
    
    // Test database creation
    let db = photoman_lib::database::Database::new(db_path.clone());
    assert!(db.is_ok(), "Database should be created successfully");
    
    let db = db.unwrap();
    
    // Test initial state
    let is_init = db.is_initialized();
    assert!(is_init.is_ok());
    assert_eq!(is_init.unwrap(), false, "Database should not be initialized yet");
    
    // Test schema version before migration
    let version = db.get_schema_version();
    assert!(version.is_ok());
    assert_eq!(version.unwrap(), 0, "Initial schema version should be 0");
    
    // Run migrations
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();
    let migration_result = photoman_lib::database::migrations::run_migrations(&conn);
    drop(conn);
    
    assert!(migration_result.is_ok(), "Migrations should run successfully");
    
    // Test state after migration
    let is_init = db.is_initialized();
    assert!(is_init.is_ok());
    assert_eq!(is_init.unwrap(), true, "Database should be initialized after migration");
    
    let version = db.get_schema_version();
    assert!(version.is_ok());
    assert_eq!(version.unwrap(), 1, "Schema version should be 1 after migration");
    
    cleanup_db(&db_path);
}

#[test]
fn test_database_tables_created() {
    let db_path = get_temp_db_path();
    let db = photoman_lib::database::Database::new(db_path.clone()).unwrap();
    
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();
    photoman_lib::database::migrations::run_migrations(&conn).unwrap();
    
    // Check all required tables exist
    let tables = vec![
        "photos",
        "tags",
        "albums",
        "photo_tags",
        "album_photos",
        "scan_jobs",
        "thumbnail_cache",
        "settings",
        "smart_albums",
        "schema_migrations",
    ];
    
    for table_name in tables {
        let count: i64 = conn
            .query_row(
                &format!(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='{}'",
                    table_name
                ),
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1, "Table {} should exist", table_name);
    }
    
    drop(conn);
    cleanup_db(&db_path);
}

#[test]
fn test_database_indexes_created() {
    let db_path = get_temp_db_path();
    let db = photoman_lib::database::Database::new(db_path.clone()).unwrap();
    
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();
    photoman_lib::database::migrations::run_migrations(&conn).unwrap();
    
    // Check some critical indexes exist
    let indexes = vec![
        "idx_photos_file_hash",
        "idx_photos_file_path",
        "idx_tags_name",
        "idx_photo_tags_photo_id",
        "idx_album_photos_album_id",
    ];
    
    for index_name in indexes {
        let count: i64 = conn
            .query_row(
                &format!(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name='{}'",
                    index_name
                ),
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1, "Index {} should exist", index_name);
    }
    
    drop(conn);
    cleanup_db(&db_path);
}

#[test]
fn test_database_default_settings() {
    let db_path = get_temp_db_path();
    let db = photoman_lib::database::Database::new(db_path.clone()).unwrap();
    
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();
    photoman_lib::database::migrations::run_migrations(&conn).unwrap();
    
    // Check default settings
    let settings_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM settings", [], |row| row.get(0))
        .unwrap();
    assert_eq!(settings_count, 6, "Should have 6 default settings");
    
    // Check specific settings
    let theme: String = conn
        .query_row("SELECT value FROM settings WHERE key='theme'", [], |row| {
            row.get(0)
        })
        .unwrap();
    assert_eq!(theme, "system");
    
    let language: String = conn
        .query_row("SELECT value FROM settings WHERE key='language'", [], |row| {
            row.get(0)
        })
        .unwrap();
    assert_eq!(language, "zh-CN");
    
    drop(conn);
    cleanup_db(&db_path);
}

#[test]
fn test_database_foreign_keys_enabled() {
    let db_path = get_temp_db_path();
    let db = photoman_lib::database::Database::new(db_path.clone()).unwrap();
    
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();
    photoman_lib::database::migrations::run_migrations(&conn).unwrap();
    
    // Try to insert invalid foreign key
    let result = conn.execute(
        "INSERT INTO photo_tags (photo_id, tag_id, created_at) VALUES (99999, 99999, datetime('now'))",
        [],
    );
    
    assert!(result.is_err(), "Foreign key constraint should be enforced");
    
    drop(conn);
    cleanup_db(&db_path);
}

#[test]
fn test_database_wal_mode() {
    let db_path = get_temp_db_path();
    let db = photoman_lib::database::Database::new(db_path.clone()).unwrap();
    
    let conn = db.get_connection();
    let conn = conn.lock().unwrap();
    
    let journal_mode: String = conn
        .query_row("PRAGMA journal_mode", [], |row| row.get(0))
        .unwrap();
    
    assert_eq!(
        journal_mode.to_lowercase(),
        "wal",
        "Journal mode should be WAL"
    );
    
    drop(conn);
    cleanup_db(&db_path);
}

