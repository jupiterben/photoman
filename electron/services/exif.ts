import exifr from 'exifr';
import { BaseService } from './base-service';
import { createImageProcessingError, ErrorCode } from '../utils/error-handler';
import type { ExifData } from '../types';

/**
 * EXIF数据提取服务
 * 使用exifr库从图片中提取元数据
 */
export class ExifService extends BaseService {
  constructor() {
    super('ExifService');
  }

  /**
   * 初始化服务
   */
  protected initializeService(): void {
    // EXIF服务不需要特殊初始化
  }

  /**
   * 从图片文件提取EXIF数据
   */
  async extractExif(photoPath: string): Promise<ExifData & { width?: number; height?: number; title?: string; description?: string }> {
    try {
      // 解析EXIF数据
      const exif = await exifr.parse(photoPath, {
        tiff: true,
        exif: true,
        gps: true,
        iptc: true,
        xmp: true,
      });

      if (!exif) {
        return {};
      }

      // 提取图片尺寸
      const width = exif.ImageWidth || exif.ExifImageWidth || exif.PixelXDimension;
      const height = exif.ImageHeight || exif.ExifImageHeight || exif.PixelYDimension;

      // 提取标题和描述（从IPTC或XMP）
      const title = exif.ObjectName || exif.Headline || exif.Title || exif['dc:title'];
      const description =
        exif.Caption ||
        exif['Caption-Abstract'] ||
        exif.Description ||
        exif['dc:description'] ||
        exif.ImageDescription;

      // 提取拍摄日期
      let takenAt: Date | undefined;
      if (exif.DateTimeOriginal) {
        takenAt = new Date(exif.DateTimeOriginal);
      } else if (exif.CreateDate) {
        takenAt = new Date(exif.CreateDate);
      } else if (exif.DateTime) {
        takenAt = new Date(exif.DateTime);
      }

      // 提取相机信息
      const cameraMake = exif.Make;
      const cameraModel = exif.Model;
      const lensModel = exif.LensModel || exif.LensInfo;

      // 提取拍摄参数
      const focalLength = exif.FocalLength;
      const aperture = exif.FNumber || exif.ApertureValue;
      const iso = exif.ISO || exif.ISOSpeedRatings;

      // 处理快门速度
      let shutterSpeed: string | undefined;
      if (exif.ExposureTime) {
        if (exif.ExposureTime < 1) {
          shutterSpeed = `1/${Math.round(1 / exif.ExposureTime)}`;
        } else {
          shutterSpeed = `${exif.ExposureTime}s`;
        }
      } else if (exif.ShutterSpeedValue) {
        shutterSpeed = `${exif.ShutterSpeedValue}`;
      }

      // 提取GPS信息
      const gpsLatitude = exif.latitude;
      const gpsLongitude = exif.longitude;
      const gpsAltitude = exif.GPSAltitude;

      return {
        width,
        height,
        title: typeof title === 'string' ? title : undefined,
        description: typeof description === 'string' ? description : undefined,
        takenAt,
        cameraMake,
        cameraModel,
        lensModel,
        focalLength,
        aperture,
        shutterSpeed,
        iso,
        gpsLatitude,
        gpsLongitude,
        gpsAltitude,
      };
    } catch (error: any) {
      // 某些图片可能没有EXIF数据或格式不支持
      this.logger?.debug(`[EXIF] Failed to extract EXIF from ${photoPath}:`, error.message);
      return {};
    }
  }

  /**
   * 批量提取EXIF（可选优化）
   */
  async extractExifBatch(photoPaths: string[]): Promise<Map<string, ExifData>> {
    const results = new Map<string, ExifData>();

    // 使用Promise.all并行处理，但限制并发数
    const concurrency = 5;
    for (let i = 0; i < photoPaths.length; i += concurrency) {
      const batch = photoPaths.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(async (path) => ({
          path,
          data: await this.extractExif(path),
        }))
      );

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.set(result.value.path, result.value.data);
        }
      });
    }

    return results;
  }

  /**
   * 获取logger引用
   */
  private get logger() {
    return require('../utils/logger').logger;
  }
}

// 导出单例
export const exifService = new ExifService();

