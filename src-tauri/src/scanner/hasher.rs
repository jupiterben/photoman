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

