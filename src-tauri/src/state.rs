// Application state management
use crate::database::Database;
use crate::watcher::WatcherManager;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// Global application state
/// This struct holds all shared state that needs to be accessed across Tauri commands
pub struct AppState {
    /// Database connection wrapper (Arc<Mutex> for shared access)
    pub db: Arc<Mutex<rusqlite::Connection>>,
    /// Database file path
    pub db_path: PathBuf,
    /// Watcher manager for file system monitoring
    pub watcher_manager: Option<Arc<Mutex<WatcherManager>>>,
}

impl AppState {
    /// Create a new application state with the given database
    pub fn new(db: Database) -> Self {
        // 获取 Database 中的 Arc<Mutex<Connection>>
        let conn = db.get_connection();
        let path = db.get_path().clone();

        // 创建监控管理器
        let watcher_manager = WatcherManager::new(path.clone());

        Self {
            db: conn,
            db_path: path,
            watcher_manager: Some(Arc::new(Mutex::new(watcher_manager))),
        }
    }
}
