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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;
    
    #[test]
    fn test_walk_directory_recursive() {
        let temp_dir = TempDir::new().unwrap();
        let root = temp_dir.path();
        
        // 创建测试文件结构
        fs::create_dir(root.join("subdir")).unwrap();
        fs::write(root.join("file1.txt"), "test").unwrap();
        fs::write(root.join("subdir").join("file2.txt"), "test").unwrap();
        
        let files = walk_directory(root, true).unwrap();
        assert_eq!(files.len(), 2);
    }
    
    #[test]
    fn test_walk_directory_non_recursive() {
        let temp_dir = TempDir::new().unwrap();
        let root = temp_dir.path();
        
        fs::create_dir(root.join("subdir")).unwrap();
        fs::write(root.join("file1.txt"), "test").unwrap();
        fs::write(root.join("subdir").join("file2.txt"), "test").unwrap();
        
        let files = walk_directory(root, false).unwrap();
        assert_eq!(files.len(), 1); // 只扫描根目录
    }
}

