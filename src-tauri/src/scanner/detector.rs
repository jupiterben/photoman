// T051: 实现图片格式检测（使用image crate）
use std::path::Path;
use image::ImageFormat;
use crate::error::{PhotoManError, Result};

/// 支持的图片格式
const SUPPORTED_FORMATS: &[&str] = &[
    "jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "tif", "ico"
];

/// 检测文件是否为图片
pub fn is_image_file(path: &Path) -> bool {
    if let Some(ext) = path.extension() {
        let ext_lower = ext.to_string_lossy().to_lowercase();
        return SUPPORTED_FORMATS.contains(&ext_lower.as_str());
    }
    false
}

/// 获取图片格式
pub fn get_image_format(path: &Path) -> Result<String> {
    // 先通过扩展名判断
    if let Some(ext) = path.extension() {
        let ext_lower = ext.to_string_lossy().to_lowercase();
        if SUPPORTED_FORMATS.contains(&ext_lower.as_str()) {
            return Ok(normalize_format(&ext_lower));
        }
    }
    
    // 如果扩展名不支持，尝试读取文件头判断
    let reader = image::io::Reader::open(path)
        .map_err(|e| PhotoManError::image_error(format!("无法打开图片: {}", e)))?;
    
    let format = reader.format();
    
    if let Some(fmt) = format {
        Ok(format_to_string(fmt))
    } else {
        Err(PhotoManError::image_error("无法识别图片格式"))
    }
}

/// 获取图片尺寸
pub fn get_image_dimensions(path: &Path) -> Result<(u32, u32)> {
    let img = image::open(path)
        .map_err(|e| PhotoManError::image_error(format!("无法读取图片: {}", e)))?;
    
    Ok((img.width(), img.height()))
}

/// 标准化格式名称
fn normalize_format(ext: &str) -> String {
    match ext {
        "jpg" | "jpeg" => "JPEG".to_string(),
        "png" => "PNG".to_string(),
        "gif" => "GIF".to_string(),
        "bmp" => "BMP".to_string(),
        "webp" => "WEBP".to_string(),
        "tiff" | "tif" => "TIFF".to_string(),
        "ico" => "ICO".to_string(),
        _ => ext.to_uppercase(),
    }
}

fn format_to_string(format: ImageFormat) -> String {
    match format {
        ImageFormat::Jpeg => "JPEG".to_string(),
        ImageFormat::Png => "PNG".to_string(),
        ImageFormat::Gif => "GIF".to_string(),
        ImageFormat::Bmp => "BMP".to_string(),
        ImageFormat::WebP => "WEBP".to_string(),
        ImageFormat::Tiff => "TIFF".to_string(),
        ImageFormat::Ico => "ICO".to_string(),
        _ => "UNKNOWN".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    
    #[test]
    fn test_is_image_file() {
        assert!(is_image_file(&PathBuf::from("test.jpg")));
        assert!(is_image_file(&PathBuf::from("test.PNG")));
        assert!(is_image_file(&PathBuf::from("test.webp")));
        assert!(!is_image_file(&PathBuf::from("test.txt")));
        assert!(!is_image_file(&PathBuf::from("test.mp4")));
    }
    
    #[test]
    fn test_normalize_format() {
        assert_eq!(normalize_format("jpg"), "JPEG");
        assert_eq!(normalize_format("jpeg"), "JPEG");
        assert_eq!(normalize_format("png"), "PNG");
    }
}

