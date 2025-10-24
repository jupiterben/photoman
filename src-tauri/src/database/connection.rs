// Database connection manager
use rusqlite::{Connection, OpenFlags};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// Database connection wrapper with connection pooling
#[derive(Debug)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,
    db_path: PathBuf,
}

impl Database {
    /// Create a new database connection
    ///
    /// # Arguments
    /// * `db_path` - Path to the SQLite database file
    ///
    /// # Returns
    /// * `Result<Self, rusqlite::Error>` - Database instance or error
    pub fn new(db_path: PathBuf) -> Result<Self, rusqlite::Error> {
        log::info!("Opening database at: {:?}", db_path);

        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                log::error!("Failed to create database directory: {}", e);
                rusqlite::Error::InvalidPath(db_path.clone())
            })?;
        }

        let conn = Connection::open_with_flags(
            &db_path,
            OpenFlags::SQLITE_OPEN_READ_WRITE
                | OpenFlags::SQLITE_OPEN_CREATE
                | OpenFlags::SQLITE_OPEN_NO_MUTEX,
        )?;

        // Enable WAL mode for better concurrency
        conn.execute_batch("PRAGMA journal_mode = WAL;")?;

        // Enable foreign keys
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;

        // Optimize SQLite settings
        conn.execute_batch(
            "
            PRAGMA synchronous = NORMAL;
            PRAGMA cache_size = -64000;
            PRAGMA temp_store = MEMORY;
            PRAGMA mmap_size = 30000000000;
        ",
        )?;

        log::info!("Database opened successfully with WAL mode");

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
            db_path,
        })
    }

    /// Get the database connection
    pub fn get_connection(&self) -> Arc<Mutex<Connection>> {
        Arc::clone(&self.conn)
    }

    /// Get the database path
    pub fn get_path(&self) -> &PathBuf {
        &self.db_path
    }

    /// Execute a query with no return value
    pub fn execute(&self, sql: &str, params: &[&dyn rusqlite::ToSql]) -> Result<usize, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(sql, params)
    }

    /// Execute a batch of SQL statements
    pub fn execute_batch(&self, sql: &str) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(sql)
    }

    /// Check if the database is initialized (has tables)
    pub fn is_initialized(&self) -> Result<bool, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='photos'"
        )?;
        let count: i64 = stmt.query_row([], |row| row.get(0))?;
        Ok(count > 0)
    }

    /// Get the current schema version
    pub fn get_schema_version(&self) -> Result<i32, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        
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

    /// Close the database connection
    pub fn close(self) -> Result<(), rusqlite::Error> {
        log::info!("Closing database connection");
        // The connection will be closed when it goes out of scope
        Ok(())
    }
}

impl Clone for Database {
    fn clone(&self) -> Self {
        Self {
            conn: Arc::clone(&self.conn),
            db_path: self.db_path.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn get_temp_db_path() -> PathBuf {
        let mut path = std::env::temp_dir();
        path.push(format!("photoman_test_{}.db", chrono::Utc::now().timestamp()));
        path
    }

    fn cleanup_db(path: &PathBuf) {
        let _ = fs::remove_file(path);
        let _ = fs::remove_file(format!("{}-wal", path.display()));
        let _ = fs::remove_file(format!("{}-shm", path.display()));
    }

    #[test]
    fn test_database_creation() {
        let db_path = get_temp_db_path();
        let db = Database::new(db_path.clone());
        assert!(db.is_ok());

        let db = db.unwrap();
        assert_eq!(db.get_path(), &db_path);

        cleanup_db(&db_path);
    }

    #[test]
    fn test_database_initialization_check() {
        let db_path = get_temp_db_path();
        let db = Database::new(db_path.clone()).unwrap();

        let is_init = db.is_initialized();
        assert!(is_init.is_ok());
        assert_eq!(is_init.unwrap(), false);

        cleanup_db(&db_path);
    }

    #[test]
    fn test_schema_version() {
        let db_path = get_temp_db_path();
        let db = Database::new(db_path.clone()).unwrap();

        let version = db.get_schema_version();
        assert!(version.is_ok());
        assert_eq!(version.unwrap(), 0);

        cleanup_db(&db_path);
    }

    #[test]
    fn test_execute_batch() {
        let db_path = get_temp_db_path();
        let db = Database::new(db_path.clone()).unwrap();

        let result = db.execute_batch(
            "CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT);"
        );
        assert!(result.is_ok());

        cleanup_db(&db_path);
    }

    #[test]
    fn test_wal_mode_enabled() {
        let db_path = get_temp_db_path();
        let db = Database::new(db_path.clone()).unwrap();

        let conn = db.get_connection();
        let conn = conn.lock().unwrap();
        
        let journal_mode: String = conn
            .query_row("PRAGMA journal_mode", [], |row| row.get(0))
            .unwrap();
        
        assert_eq!(journal_mode.to_lowercase(), "wal");

        cleanup_db(&db_path);
    }
}

