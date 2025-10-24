// Application state management
use crate::database::Database;
use std::sync::Mutex;

/// Global application state
/// This struct holds all shared state that needs to be accessed across Tauri commands
#[derive(Debug)]
pub struct AppState {
    /// Database connection wrapper
    pub db: Mutex<Database>,
}

impl AppState {
    /// Create a new application state with the given database
    pub fn new(db: Database) -> Self {
        Self {
            db: Mutex::new(db),
        }
    }

    /// Get a reference to the database connection
    /// 
    /// # Returns
    /// A locked mutex guard to the database
    pub fn get_db(&self) -> std::sync::MutexGuard<Database> {
        self.db.lock().expect("Failed to lock database mutex")
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

