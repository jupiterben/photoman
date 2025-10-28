// T050: 实现文件系统遍历（使用walkdir）
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use crate::error::Result;

/// 遍历目录，返回所有文件路径
pub fn walk_directory(path: &Path, recursive: bool) -> Result<Vec<PathBuf>> {
    let mut files = Vec::new();
    
    let walker = if recursive {
        WalkDir::new(path)
            .follow_links(false)
            .max_depth(100)
    } else {
        WalkDir::new(path)
            .follow_links(false)
            .max_depth(1)
    };
    
    for entry in walker {
        match entry {
            Ok(entry) => {
                if entry.file_type().is_file() {
                    files.push(entry.path().to_path_buf());
                }
            }
            Err(e) => {
                eprintln!("警告: 无法访问路径: {}", e);
                // 继续扫描其他文件，不中断整个流程
            }
        }
    }
    
    Ok(files)
}

