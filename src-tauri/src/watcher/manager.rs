// Watcher manager for handling multiple directory watchers
// T182-T185: 实现监控器生命周期管理、多目录监控、状态同步和前端事件

use super::listener::{FileSystemEvent, WatcherListener};
use crate::database::watched_directories;
use crate::scanner::service::ScanService;
use rusqlite::Connection;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

/// 监控器状态
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub enum WatcherStatus {
    /// 未启动
    Stopped,
    /// 运行中
    Running,
    /// 已暂停
    Paused,
    /// 错误状态
    Error(String),
}

/// 监控目录信息
#[derive(Debug, Clone)]
struct WatchedInfo {
    #[allow(dead_code)]
    id: i64,
    path: PathBuf,
    #[allow(dead_code)]
    recursive: bool,
    status: WatcherStatus,
}

/// 监控器管理器
/// T182-T183: 实现监控器生命周期管理和多目录并发监控
pub struct WatcherManager {
    watched_dirs: Arc<Mutex<HashMap<i64, WatchedInfo>>>,
    listener: Arc<Mutex<Option<WatcherListener>>>,
    app_handle: Option<AppHandle>,
    is_running: Arc<Mutex<bool>>,
    db_path: PathBuf,
    scan_service: Arc<ScanService>,
}

impl WatcherManager {
    /// 创建新的监控管理器
    /// T182: 生命周期管理 - 初始化
    pub fn new(db_path: PathBuf, scan_service: Arc<ScanService>) -> Self {
        Self {
            watched_dirs: Arc::new(Mutex::new(HashMap::new())),
            listener: Arc::new(Mutex::new(None)),
            app_handle: None,
            is_running: Arc::new(Mutex::new(false)),
            db_path,
            scan_service,
        }
    }

    /// 设置 Tauri AppHandle
    /// T185: 准备前端事件发送
    pub fn set_app_handle(&mut self, handle: AppHandle) {
        self.app_handle = Some(handle);
    }

    /// 启动监控管理器
    /// T182: 生命周期管理 - 启动
    pub fn start(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut is_running = self.is_running.lock().unwrap();
        if *is_running {
            return Ok(());
        }

        // 创建监听器
        let listener = WatcherListener::new()?;
        *self.listener.lock().unwrap() = Some(listener);
        *is_running = true;

        log::info!("监控管理器已启动");

        // 启动事件处理循环
        self.start_event_loop();

        Ok(())
    }

    /// 停止监控管理器
    /// T182: 生命周期管理 - 停止
    pub fn stop(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut is_running = self.is_running.lock().unwrap();
        if !*is_running {
            return Ok(());
        }

        *is_running = false;
        *self.listener.lock().unwrap() = None;

        log::info!("监控管理器已停止");
        Ok(())
    }

    /// 添加监控目录
    /// T183: 多目录并发监控 - 添加
    pub fn add_watch(
        &self,
        id: i64,
        path: PathBuf,
        recursive: bool,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        // 添加到监听器
        if let Some(listener) = self.listener.lock().unwrap().as_mut() {
            listener.watch(&path, recursive)?;
        } else {
            return Err("监控管理器未启动".into());
        }

        // 记录监控信息
        let info = WatchedInfo {
            id,
            path: path.clone(),
            recursive,
            status: WatcherStatus::Running,
        };

        self.watched_dirs.lock().unwrap().insert(id, info);
        log::info!("添加监控目录: {:?} (ID: {})", path, id);

        Ok(())
    }

    /// 移除监控目录
    /// T183: 多目录并发监控 - 移除
    pub fn remove_watch(&self, id: i64) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let info = {
            let mut dirs = self.watched_dirs.lock().unwrap();
            dirs.remove(&id)
        };

        if let Some(info) = info {
            if let Some(listener) = self.listener.lock().unwrap().as_mut() {
                listener.unwatch(&info.path)?;
            }
            log::info!("移除监控目录: {:?} (ID: {})", info.path, id);
        }

        Ok(())
    }

    /// 暂停监控目录
    /// T182: 生命周期管理 - 暂停
    pub fn pause_watch(&self, id: i64) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut dirs = self.watched_dirs.lock().unwrap();
        if let Some(info) = dirs.get_mut(&id) {
            info.status = WatcherStatus::Paused;
            log::info!("暂停监控目录 ID: {}", id);
        }
        Ok(())
    }

    /// 恢复监控目录
    /// T182: 生命周期管理 - 恢复
    pub fn resume_watch(&self, id: i64) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut dirs = self.watched_dirs.lock().unwrap();
        if let Some(info) = dirs.get_mut(&id) {
            info.status = WatcherStatus::Running;
            log::info!("恢复监控目录 ID: {}", id);
        }
        Ok(())
    }

    /// 启动事件处理循环
    /// T181: 事件处理 + T185: 前端事件发送
    fn start_event_loop(&self) {
        let listener = Arc::clone(&self.listener);
        let watched_dirs = Arc::clone(&self.watched_dirs);
        let is_running = Arc::clone(&self.is_running);
        let app_handle = self.app_handle.clone();
        let scan_service = Arc::clone(&self.scan_service);

        thread::spawn(move || {
            log::info!("事件处理循环已启动");

            while *is_running.lock().unwrap() {
                // 接收文件系统事件
                let events = if let Some(l) = listener.lock().unwrap().as_ref() {
                    l.receive_events(Duration::from_millis(100))
                } else {
                    thread::sleep(Duration::from_millis(100));
                    continue;
                };

                if events.is_empty() {
                    continue;
                }

                log::debug!("接收到 {} 个文件系统事件", events.len());

                // 处理每个事件
                for event in events {
                    // 检查目录是否处于运行状态
                    let should_process = {
                        let dirs = watched_dirs.lock().unwrap();
                        dirs.values().any(|info| {
                            info.status == WatcherStatus::Running
                                && event.path().starts_with(&info.path)
                        })
                    };

                    if !should_process {
                        continue;
                    }

                    // 处理事件
                    Self::process_file_system_event(&event, &scan_service);

                    // T185: 发送事件到前端
                    if let Some(handle) = &app_handle {
                        Self::emit_event_to_frontend(handle, &event);
                    }
                }

                // T184: 定期同步状态到数据库（每分钟）
                // 这里简化处理，实际可以用定时器
            }

            log::info!("事件处理循环已停止");
        });
    }

    /// 处理文件系统事件
    /// T181: 事件处理逻辑 - 已集成扫描服务
    fn process_file_system_event(event: &FileSystemEvent, scan_service: &Arc<ScanService>) {
        match event {
            FileSystemEvent::Created(path) => {
                log::info!("检测到新文件: {:?}", path);
                if let Err(e) = scan_service.scan_single_file(path) {
                    log::error!("扫描新文件失败: {}", e);
                }
            }
            FileSystemEvent::Modified(path) => {
                log::info!("检测到文件修改: {:?}", path);
                if let Err(e) = scan_service.handle_file_modified(path) {
                    log::error!("处理文件修改失败: {}", e);
                }
            }
            FileSystemEvent::Deleted(path) => {
                log::info!("检测到文件删除: {:?}", path);
                if let Err(e) = scan_service.handle_file_deleted(path) {
                    log::error!("处理文件删除失败: {}", e);
                }
            }
            FileSystemEvent::Renamed { from, to } => {
                log::info!("检测到文件重命名: {:?} -> {:?}", from, to);
                if let Err(e) = scan_service.handle_file_renamed(from, to) {
                    log::error!("处理文件重命名失败: {}", e);
                }
            }
        }
    }

    /// 发送事件到前端
    /// T185: 实现文件变化事件发送到前端
    fn emit_event_to_frontend(handle: &AppHandle, event: &FileSystemEvent) {
        let event_data = serde_json::json!({
            "type": event.event_type(),
            "path": event.path().to_string_lossy(),
        });

        if let Err(e) = handle.emit("file-system-event", event_data) {
            log::error!("发送前端事件失败: {}", e);
        }
    }

    /// 获取所有监控目录状态
    /// T184: 状态查询
    pub fn get_watched_directories(&self) -> Vec<(i64, PathBuf, WatcherStatus)> {
        let dirs = self.watched_dirs.lock().unwrap();
        dirs.iter()
            .map(|(id, info)| (*id, info.path.clone(), info.status.clone()))
            .collect()
    }

    /// 同步监控状态到数据库
    /// T184: 实现监控状态同步到数据库
    pub fn sync_status_to_database(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let conn = Connection::open(&self.db_path)?;
        let dirs = self.watched_dirs.lock().unwrap();

        for (id, info) in dirs.iter() {
            let (status_str, error_msg) = match &info.status {
                WatcherStatus::Running => ("active", None),
                WatcherStatus::Paused => ("paused", None),
                WatcherStatus::Stopped => ("paused", None),
                WatcherStatus::Error(msg) => ("error", Some(msg.clone())),
            };

            if let Err(e) = watched_directories::update_status(&conn, *id, status_str, error_msg) {
                log::error!("同步状态到数据库失败 (ID: {}): {}", id, e);
            }
        }

        Ok(())
    }

    /// 从数据库加载监控目录
    /// T183: 启动时恢复监控
    pub fn load_from_database(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let conn = Connection::open(&self.db_path)?;
        let dirs = watched_directories::list_by_status(&conn, "active")
            .map_err(|e| format!("加载监控目录失败: {}", e))?;

        for dir in dirs {
            if let Some(id) = dir.id {
                let path = PathBuf::from(&dir.directory_path);
                if let Err(e) = self.add_watch(id, path, dir.recursive) {
                    log::error!("恢复监控目录失败 (ID: {}): {}", id, e);

                    // 更新为错误状态
                    let _ =
                        watched_directories::update_status(&conn, id, "error", Some(e.to_string()));
                }
            }
        }

        log::info!(
            "从数据库加载了 {} 个监控目录",
            self.watched_dirs.lock().unwrap().len()
        );
        Ok(())
    }
}

impl Drop for WatcherManager {
    fn drop(&mut self) {
        let _ = self.stop();
    }
}
