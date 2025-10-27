// T076: 虚拟滚动网格组件（使用react-window）
import { useEffect, useState, useCallback, useRef } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Empty } from 'antd';
import { PhotoCard } from './PhotoCard';
import { useAppStore, usePhotoStore, useSettingsStore } from '@/stores';
import type { Photo } from '@/api/photos';
import './PhotoGrid.css';

interface PhotoGridProps {
  onPhotoClick?: (photo: Photo) => void;
}

export function PhotoGrid({ onPhotoClick }: PhotoGridProps) {
  const { photos } = usePhotoStore();
  const { selectedPhotoIds, selectPhoto, togglePhotoSelection } = useAppStore();
  const { thumbnailSize } = useSettingsStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 根据缩略图大小计算卡片尺寸
  const cardSizeMap = {
    small: 150,
    medium: 200,
    large: 300,
  };

  const cardSize = cardSizeMap[thumbnailSize || 'medium'];
  const cardGap = 16;
  const totalCardSize = cardSize + cardGap;

  // 监听容器尺寸变化
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 计算列数
  const getColumnCount = useCallback(
    (width: number) => {
      return Math.floor(width / totalCardSize) || 1;
    },
    [totalCardSize]
  );

  // 计算行数
  const getRowCount = useCallback(
    (columnCount: number) => {
      return Math.ceil(photos.length / columnCount);
    },
    [photos.length]
  );

  const handlePhotoSelect = useCallback(
    (id: number, selected: boolean, event?: React.MouseEvent) => {
      if (event?.ctrlKey || event?.metaKey) {
        // Ctrl/Cmd + 点击：多选
        togglePhotoSelection(id);
      } else if (event?.shiftKey && selectedPhotoIds.size > 0) {
        // Shift + 点击：范围选择
        // TODO: 实现范围选择逻辑
        selectPhoto(id, true);
      } else {
        // 普通点击
        if (selected) {
          selectPhoto(id, false);
        } else {
          selectPhoto(id, false);
        }
      }
    },
    [selectedPhotoIds, selectPhoto, togglePhotoSelection]
  );

  // 渲染单元格
  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }: any) => {
      const index = rowIndex * getColumnCount(window.innerWidth) + columnIndex;
      const photo = photos[index];

      if (!photo) {
        return null;
      }

      return (
        <div
          style={{
            ...style,
            padding: cardGap / 2,
          }}
        >
          <PhotoCard
            photo={photo}
            selected={selectedPhotoIds.has(photo.id)}
            size={thumbnailSize || 'medium'}
            onSelect={(id, selected) => handlePhotoSelect(id, selected)}
            onClick={onPhotoClick}
          />
        </div>
      );
    },
    [
      photos,
      selectedPhotoIds,
      thumbnailSize,
      cardGap,
      handlePhotoSelect,
      onPhotoClick,
      getColumnCount,
    ]
  );

  if (photos.length === 0) {
    return (
      <div className="photo-grid-empty">
        <Empty description="暂无照片" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  const columnCount = getColumnCount(dimensions.width);
  const rowCount = getRowCount(columnCount);

  return (
    <div className="photo-grid-container" ref={containerRef}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Grid
          columnCount={columnCount}
          columnWidth={totalCardSize}
          height={dimensions.height}
          rowCount={rowCount}
          rowHeight={totalCardSize}
          width={dimensions.width}
          overscanRowCount={2}
          className="photo-grid"
        >
          {Cell}
        </Grid>
      )}
    </div>
  );
}
