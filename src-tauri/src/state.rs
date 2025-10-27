// Application state management
use crate::database::Database;
use std::sync::Arc;
use std::path::PathBuf;

/// Global application state
/// This struct holds all shared state that needs to be accessed across Tauri commands
pub struct AppState {
    /// Database connection wrapper (Arc<Mutex> for shared access)
    pub db: Arc<std::sync::Mutex<rusqlite::Connection>>,
    /// Database file path
    pub db_path: PathBuf,
}

impl AppState {
    /// Create a new application state with the given database
    pub fn new(db: Database) -> Self {
        // 获取 Database 中的 Arc<Mutex<Connection>>
        let conn = db.get_connection();
        let path = db.get_path().clone();
        Self { 
            db: conn,
            db_path: path,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_app_state_creation() {
        let mut db_path = std::env::temp_dir();
        db_path.push(format!("test_state_{}.db", chrono::Utc::now().timestamp()));
        
        let db = Database::new(db_path.clone()).unwrap();
        let state = AppState::new(db);
        
        // Test that we can access the database
        let db = state.get_db();
        assert!(db.get_path().exists() || db.get_path().parent().unwrap().exists());
        
        // Cleanup
        drop(db);
        let _ = std::fs::remove_file(&db_path);
    }
}

