// T063, T064: 实现缩略图生成器（使用image crate）
use std::path::{Path, PathBuf};
use image::{DynamicImage, ImageFormat};
use crate::error::{PhotoManError, Result};
use super::ThumbnailSize;

/// 生成缩略图
pub fn generate_thumbnail(
    source_path: &Path,
    output_path: &Path,
    size: ThumbnailSize,
) -> Result<u64> {
    // 读取原图
    let img = image::open(source_path)
        .map_err(|e| PhotoManError::image_error(format!("无法打开图片: {}", e)))?;
    
    // 生成缩略图
    let thumbnail = resize_image(&img, size);
    
    // 确保输出目录存在
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| PhotoManError::io_error(format!("创建目录失败: {}", e)))?;
    }
    
    // 保存缩略图（使用JPEG格式以节省空间）
    thumbnail
        .save_with_format(output_path, ImageFormat::Jpeg)
        .map_err(|e| PhotoManError::image_error(format!("保存缩略图失败: {}", e)))?;
    
    // 返回文件大小
    let metadata = std::fs::metadata(output_path)
        .map_err(|e| PhotoManError::io_error(format!("读取文件信息失败: {}", e)))?;
    
    Ok(metadata.len())
}

/// 调整图片大小（保持宽高比）
fn resize_image(img: &DynamicImage, size: ThumbnailSize) -> DynamicImage {
    let (target_width, target_height) = size.dimensions();
    
    // 使用 Lanczos3 算法获得更好的质量
    img.resize(target_width, target_height, image::imageops::FilterType::Lanczos3)
}

/// 批量生成缩略图
pub async fn generate_thumbnails_batch(
    sources: Vec<(PathBuf, PathBuf, ThumbnailSize)>,
) -> Vec<Result<u64>> {
    use tokio::task;
    
    let mut handles = Vec::new();
    
    for (source, output, size) in sources {
        let handle = task::spawn_blocking(move || {
            generate_thumbnail(&source, &output, size)
        });
        handles.push(handle);
    }
    
    let mut results = Vec::new();
    for handle in handles {
        match handle.await {
            Ok(result) => results.push(result),
            Err(e) => results.push(Err(PhotoManError::tauri_error(format!("任务执行失败: {}", e)))),
        }
    }
    
    results
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgb};
    use tempfile::TempDir;
    
    #[test]
    fn test_generate_thumbnail() {
        let temp_dir = TempDir::new().unwrap();
        
        // 创建测试图片（1000x800）
        let img: ImageBuffer<Rgb<u8>, Vec<u8>> = ImageBuffer::new(1000, 800);
        let source_path = temp_dir.path().join("source.jpg");
        img.save(&source_path).unwrap();
        
        // 生成小缩略图
        let output_path = temp_dir.path().join("thumb_small.jpg");
        let file_size = generate_thumbnail(&source_path, &output_path, ThumbnailSize::Small).unwrap();
        
        assert!(output_path.exists());
        assert!(file_size > 0);
        
        // 验证尺寸
        let thumb = image::open(&output_path).unwrap();
        assert!(thumb.width() <= 200);
        assert!(thumb.height() <= 200);
    }
}

