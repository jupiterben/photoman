// T083: 图片详情模态框
import { useState, useEffect, useCallback } from 'react';
import { Modal, Descriptions, Tag, Button, Space, Spin } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  StarOutlined,
  StarFilled,
  CloseOutlined,
} from '@ant-design/icons';
import { convertFileSrc } from '@tauri-apps/api/core';
import { ImageViewer } from './ImageViewer';
import type { Photo } from '@/api/photos';
import './PhotoDetail.css';

interface PhotoDetailProps {
  photo: Photo | null;
  photos?: Photo[];
  visible: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onToggleFavorite?: (id: number) => void;
}

export function PhotoDetail({
  photo,
  photos = [],
  visible,
  onClose,
  onPrevious,
  onNext,
  onToggleFavorite,
}: PhotoDetailProps) {
  const [loading, setLoading] = useState(true);
  const [metadataVisible, setMetadataVisible] = useState(true);

  useEffect(() => {
    if (photo) {
      setLoading(true);
    }
  }, [photo]);

  // T085: 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible) return;

      switch (e.key) {
        case 'ArrowLeft':
          onPrevious?.();
          break;
        case 'ArrowRight':
          onNext?.();
          break;
        case 'Escape':
          onClose();
          break;
        case 'f':
        case 'F':
          if (photo) {
            onToggleFavorite?.(photo.id);
          }
          break;
        case 'm':
        case 'M':
          setMetadataVisible((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, photo, onPrevious, onNext, onClose, onToggleFavorite]);

  // T086: 图片预加载策略
  useEffect(() => {
    if (!photo || !photos.length) return;

    const currentIndex = photos.findIndex((p) => p.id === photo.id);
    if (currentIndex === -1) return;

    // 预加载前后各一张图片
    const preloadIndexes = [currentIndex - 1, currentIndex + 1].filter(
      (idx) => idx >= 0 && idx < photos.length
    );

    preloadIndexes.forEach((idx) => {
      const img = new Image();
      img.src = convertFileSrc(photos[idx].file_path);
    });
  }, [photo, photos]);

  if (!photo) {
    return null;
  }

  const imageSrc = convertFileSrc(photo.file_path);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ top: 20, maxWidth: 1600 }}
      className="photo-detail-modal"
      closeIcon={<CloseOutlined />}
    >
      <div className="photo-detail-container">
        {/* 左侧：图片查看器 */}
        <div className="photo-detail-viewer">
          <ImageViewer src={imageSrc} alt={photo.file_name} loading={loading} />

          {/* 导航按钮 */}
          <div className="photo-detail-nav">
            <Button
              type="text"
              size="large"
              icon={<LeftOutlined />}
              onClick={onPrevious}
              className="nav-button nav-button-prev"
              disabled={!onPrevious}
            />
            <Button
              type="text"
              size="large"
              icon={<RightOutlined />}
              onClick={onNext}
              className="nav-button nav-button-next"
              disabled={!onNext}
            />
          </div>
        </div>

        {/* T087: 右侧：元数据侧边栏 */}
        {metadataVisible && (
          <div className="photo-detail-metadata">
            <div className="metadata-header">
              <h3>{photo.file_name}</h3>
              <Button
                type="text"
                icon={photo.is_favorite ? <StarFilled /> : <StarOutlined />}
                onClick={() => onToggleFavorite?.(photo.id)}
                style={{ color: photo.is_favorite ? '#faad14' : undefined }}
              >
                {photo.is_favorite ? '已收藏' : '收藏'}
              </Button>
            </div>

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="文件大小">
                {formatFileSize(photo.file_size)}
              </Descriptions.Item>
              <Descriptions.Item label="尺寸">
                {photo.width} × {photo.height}
              </Descriptions.Item>
              <Descriptions.Item label="格式">
                {photo.format?.toUpperCase() || 'Unknown'}
              </Descriptions.Item>
              <Descriptions.Item label="拍摄时间">
                {photo.taken_at ? formatDate(photo.taken_at) : '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="导入时间">
                {formatDate(photo.imported_at)}
              </Descriptions.Item>
              <Descriptions.Item label="文件路径">
                <div className="file-path">{photo.file_path}</div>
              </Descriptions.Item>
              {photo.hash && (
                <Descriptions.Item label="文件哈希">
                  <code className="hash-code">{photo.hash.substring(0, 16)}...</code>
                </Descriptions.Item>
              )}
            </Descriptions>

            {photo.tags && photo.tags.length > 0 && (
              <div className="metadata-tags">
                <h4>标签</h4>
                <Space wrap>
                  {photo.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}

            <div className="metadata-shortcuts">
              <h4>快捷键</h4>
              <ul>
                <li>
                  <kbd>←</kbd> <kbd>→</kbd> 切换图片
                </li>
                <li>
                  <kbd>F</kbd> 收藏/取消收藏
                </li>
                <li>
                  <kbd>M</kbd> 切换元数据显示
                </li>
                <li>
                  <kbd>ESC</kbd> 关闭
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
