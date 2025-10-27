// T077: 照片卡片组件
import { useState } from 'react';
import { Card, Skeleton, Checkbox } from 'antd';
import { FileImageOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { Photo } from '@/api/photos';
import './PhotoCard.css';

interface PhotoCardProps {
  photo: Photo;
  selected?: boolean;
  size?: 'small' | 'medium' | 'large';
  onSelect?: (id: number, selected: boolean) => void;
  onClick?: (photo: Photo) => void;
}

export function PhotoCard({ photo, selected, size = 'medium', onSelect, onClick }: PhotoCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const sizeMap = {
    small: 150,
    medium: 200,
    large: 300,
  };

  const cardSize = sizeMap[size];

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.photo-card-checkbox')) {
      return;
    }
    onClick?.(photo);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(photo.id, e.target.checked);
  };

  // 转换文件路径为 Tauri 可访问的 URL
  const imageSrc = convertFileSrc(photo.file_path);

  return (
    <Card
      hoverable
      className={`photo-card ${selected ? 'photo-card-selected' : ''}`}
      style={{ width: cardSize }}
      bodyStyle={{ padding: 0, height: cardSize }}
      onClick={handleCardClick}
      cover={
        <div className="photo-card-cover" style={{ height: cardSize }}>
          {loading && <Skeleton.Image active style={{ width: cardSize, height: cardSize }} />}
          {error ? (
            <div className="photo-card-error">
              <FileImageOutlined style={{ fontSize: 48, color: '#ccc' }} />
              <div>加载失败</div>
            </div>
          ) : (
            <img
              src={imageSrc}
              alt={photo.file_name}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: loading ? 'none' : 'block' }}
              className="photo-card-image"
            />
          )}
          <div className="photo-card-overlay">
            <Checkbox
              className="photo-card-checkbox"
              checked={selected}
              onChange={handleCheckboxChange}
            />
            {photo.is_favorite && <StarFilled className="photo-card-favorite" />}
          </div>
        </div>
      }
    >
      <div className="photo-card-info">
        <div className="photo-card-filename" title={photo.file_name}>
          {photo.file_name}
        </div>
        {photo.width && photo.height && (
          <div className="photo-card-dimensions">
            {photo.width} × {photo.height}
          </div>
        )}
      </div>
    </Card>
  );
}
