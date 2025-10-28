// T053: 实现重复检测逻辑
use std::collections::HashMap;
use crate::scanner::ScannedPhoto;

/// 重复检测器
pub struct DuplicateDetector {
    hash_map: HashMap<String, String>, // hash -> first_file_path
}

impl DuplicateDetector {
    pub fn new() -> Self {
        Self {
            hash_map: HashMap::new(),
        }
    }
    
    /// 从数据库加载已有的哈希值
    pub fn load_existing_hashes(&mut self, hashes: Vec<(String, String)>) {
        for (hash, path) in hashes {
            self.hash_map.insert(hash, path);
        }
    }
    
    /// 检查是否为重复文件
    /// 返回 (is_duplicate, original_path)
    pub fn check_duplicate(&self, hash: &str) -> (bool, Option<String>) {
        if let Some(original) = self.hash_map.get(hash) {
            (true, Some(original.clone()))
        } else {
            (false, None)
        }
    }
    
    /// 添加新的哈希值
    pub fn add_hash(&mut self, hash: String, path: String) {
        self.hash_map.entry(hash).or_insert(path);
    }
    
    /// 过滤重复照片
    pub fn filter_duplicates(&mut self, photos: Vec<ScannedPhoto>) -> (Vec<ScannedPhoto>, u32) {
        let mut unique_photos = Vec::new();
        let mut duplicates_count = 0;
        
        for photo in photos {
            let (is_dup, _) = self.check_duplicate(&photo.file_hash);
            
            if !is_dup {
                self.add_hash(
                    photo.file_hash.clone(),
                    photo.file_path.to_string_lossy().to_string()
                );
                unique_photos.push(photo);
            } else {
                duplicates_count += 1;
            }
        }
        
        (unique_photos, duplicates_count)
    }
}

impl Default for DuplicateDetector {
    fn default() -> Self {
        Self::new()
    }
}

