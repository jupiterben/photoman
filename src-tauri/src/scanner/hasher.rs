// T052: 实现文件哈希计算（SHA-256）
use std::fs::File;
use std::io::{BufReader, Read};
use std::path::Path;
use sha2::{Sha256, Digest};
use crate::error::{PhotoManError, Result};

/// 计算文件的 SHA-256 哈希值
pub fn calculate_file_hash(path: &Path) -> Result<String> {
    let file = File::open(path)
        .map_err(|e| PhotoManError::io_error(format!("无法打开文件 {:?}: {}", path, e)))?;
    
    let mut reader = BufReader::new(file);
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192]; // 8KB 缓冲区
    
    loop {
        let bytes_read = reader.read(&mut buffer)
            .map_err(|e| PhotoManError::io_error(format!("读取文件失败: {}", e)))?;
        
        if bytes_read == 0 {
            break;
        }
        
        hasher.update(&buffer[..bytes_read]);
    }
    
    Ok(format!("{:x}", hasher.finalize()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;
    
    #[test]
    fn test_calculate_file_hash() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        
        fs::write(&file_path, b"Hello, World!").unwrap();
        
        let hash = calculate_file_hash(&file_path).unwrap();
        
        // SHA-256 hash of "Hello, World!"
        let expected = "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f";
        assert_eq!(hash, expected);
    }
    
    #[test]
    fn test_hash_consistency() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        
        fs::write(&file_path, b"Test content").unwrap();
        
        let hash1 = calculate_file_hash(&file_path).unwrap();
        let hash2 = calculate_file_hash(&file_path).unwrap();
        
        assert_eq!(hash1, hash2);
    }
}

