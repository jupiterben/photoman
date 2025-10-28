// File system event listener
// T180-T181: 实现文件系统事件监听器和事件处理器

use notify::{
    event::{CreateKind, ModifyKind, RemoveKind},
    Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher,
};
use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, Receiver};
use std::time::Duration;

/// 文件系统事件类型
#[derive(Debug, Clone)]
pub enum FileSystemEvent {
    /// 文件创建
    Created(PathBuf),
    /// 文件修改
    Modified(PathBuf),
    /// 文件删除
    Deleted(PathBuf),
    /// 文件重命名
    Renamed { from: PathBuf, to: PathBuf },
}

impl FileSystemEvent {
    /// 获取事件涉及的文件路径
    pub fn path(&self) -> &Path {
        match self {
            Self::Created(p) | Self::Modified(p) | Self::Deleted(p) => p,
            Self::Renamed { to, .. } => to,
        }
    }

    /// 获取事件类型名称
    pub fn event_type(&self) -> &str {
        match self {
            Self::Created(_) => "created",
            Self::Modified(_) => "modified",
            Self::Deleted(_) => "deleted",
            Self::Renamed { .. } => "renamed",
        }
    }
}

/// 文件系统监听器
pub struct WatcherListener {
    watcher: RecommendedWatcher,
    receiver: Receiver<Result<Event, notify::Error>>,
}

impl WatcherListener {
    /// 创建新的监听器
    /// T180: 实现文件系统事件监听器
    pub fn new() -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let (tx, rx) = channel();

        let watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
            if let Err(e) = tx.send(res) {
                log::error!("Failed to send file system event: {}", e);
            }
        })?;

        Ok(Self {
            watcher,
            receiver: rx,
        })
    }

    /// 开始监控目录
    /// T180: 监听器添加监控路径
    pub fn watch(
        &mut self,
        path: &Path,
        recursive: bool,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mode = if recursive {
            RecursiveMode::Recursive
        } else {
            RecursiveMode::NonRecursive
        };

        self.watcher.watch(path, mode)?;
        log::info!("开始监控目录: {:?} (递归: {})", path, recursive);
        Ok(())
    }

    /// 停止监控目录
    /// T180: 监听器移除监控路径
    pub fn unwatch(&mut self, path: &Path) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.watcher.unwatch(path)?;
        log::info!("停止监控目录: {:?}", path);
        Ok(())
    }

    /// 接收文件系统事件
    /// T181: 实现事件处理器
    pub fn receive_events(&self, timeout: Duration) -> Vec<FileSystemEvent> {
        let mut events = Vec::new();
        let deadline = std::time::Instant::now() + timeout;

        while std::time::Instant::now() < deadline {
            match self.receiver.try_recv() {
                Ok(Ok(event)) => {
                    // 过滤并转换事件
                    if let Some(fs_events) = Self::process_event(event) {
                        events.extend(fs_events);
                    }
                }
                Ok(Err(e)) => {
                    log::error!("文件系统监控错误: {}", e);
                }
                Err(std::sync::mpsc::TryRecvError::Empty) => break,
                Err(std::sync::mpsc::TryRecvError::Disconnected) => {
                    log::error!("文件系统监控通道已断开");
                    break;
                }
            }
        }

        events
    }

    /// 处理 notify 事件并转换为应用事件
    /// T181: 事件转换和过滤
    fn process_event(event: Event) -> Option<Vec<FileSystemEvent>> {
        let mut fs_events = Vec::new();

        match event.kind {
            // 文件创建事件
            EventKind::Create(CreateKind::File) => {
                for path in event.paths {
                    if Self::is_image_file(&path) {
                        fs_events.push(FileSystemEvent::Created(path));
                    }
                }
            }

            // 文件修改事件
            EventKind::Modify(ModifyKind::Data(_)) | EventKind::Modify(ModifyKind::Any) => {
                for path in event.paths {
                    if Self::is_image_file(&path) {
                        fs_events.push(FileSystemEvent::Modified(path));
                    }
                }
            }

            // 文件删除事件
            EventKind::Remove(RemoveKind::File) => {
                for path in event.paths {
                    if Self::is_image_file(&path) {
                        fs_events.push(FileSystemEvent::Deleted(path));
                    }
                }
            }

            // 文件重命名事件
            EventKind::Modify(ModifyKind::Name(_)) => {
                if event.paths.len() == 2 {
                    let from = event.paths[0].clone();
                    let to = event.paths[1].clone();
                    
                    if Self::is_image_file(&to) || Self::is_image_file(&from) {
                        fs_events.push(FileSystemEvent::Renamed { from, to });
                    }
                }
            }

            // 忽略其他事件
            _ => {}
        }

        if fs_events.is_empty() {
            None
        } else {
            Some(fs_events)
        }
    }

    /// 检查是否为图片文件
    /// T181: 图片格式过滤
    fn is_image_file(path: &Path) -> bool {
        if let Some(ext) = path.extension() {
            let ext_lower = ext.to_string_lossy().to_lowercase();
            matches!(
                ext_lower.as_str(),
                "jpg" | "jpeg" | "png" | "gif" | "bmp" | "webp" | "heic" | "heif" | "tiff" | "tif"
            )
        } else {
            false
        }
    }
}

/// 事件处理器 trait
/// T181: 定义事件处理接口
pub trait EventHandler: Send + Sync {
    /// 处理文件创建事件
    fn handle_created(&self, path: &Path);

    /// 处理文件修改事件
    fn handle_modified(&self, path: &Path);

    /// 处理文件删除事件
    fn handle_deleted(&self, path: &Path);

    /// 处理文件重命名事件
    fn handle_renamed(&self, from: &Path, to: &Path);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_image_file() {
        assert!(WatcherListener::is_image_file(Path::new("test.jpg")));
        assert!(WatcherListener::is_image_file(Path::new("test.PNG")));
        assert!(WatcherListener::is_image_file(Path::new("photo.JPEG")));
        assert!(WatcherListener::is_image_file(Path::new("image.webp")));
        assert!(!WatcherListener::is_image_file(Path::new("doc.txt")));
        assert!(!WatcherListener::is_image_file(Path::new("video.mp4")));
        assert!(!WatcherListener::is_image_file(Path::new("noext")));
    }

    #[test]
    fn test_file_system_event() {
        let event = FileSystemEvent::Created(PathBuf::from("/test/image.jpg"));
        assert_eq!(event.event_type(), "created");
        assert_eq!(event.path(), Path::new("/test/image.jpg"));

        let event = FileSystemEvent::Renamed {
            from: PathBuf::from("/old.jpg"),
            to: PathBuf::from("/new.jpg"),
        };
        assert_eq!(event.event_type(), "renamed");
        assert_eq!(event.path(), Path::new("/new.jpg"));
    }
}

