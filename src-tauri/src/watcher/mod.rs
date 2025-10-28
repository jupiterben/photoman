// File system watcher module
// T179-T185: 实现文件系统实时监控

pub mod listener;
pub mod manager;

pub use manager::{WatcherManager, WatcherStatus};

// Re-export for convenience
pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

