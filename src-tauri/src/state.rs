// Application state management
use crate::database::Database;
use crate::scanner::service::ScanService;
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
    /// Scan service for background scanning
    pub scan_service: Arc<ScanService>,
}

impl AppState {
    /// Create a new application state with the given database
    pub fn new(db: Database) -> Self {
        // 获取 Database 中的 Arc<Mutex<Connection>>
        let conn: Arc<Mutex<rusqlite::Connection>> = db.get_connection();
        let path: PathBuf = db.get_path().clone();

        // 创建扫描服务
        let scan_service: Arc<ScanService> = Arc::new(ScanService::new(Arc::clone(&conn)));

        // 创建监控管理器
        let watcher_manager: WatcherManager =
            WatcherManager::new(path.clone(), Arc::clone(&scan_service));

        Self {
            db: conn,
            db_path: path,
            watcher_manager: Some(Arc::new(Mutex::new(watcher_manager))),
            scan_service,
        }
    }
}
