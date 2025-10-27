// T076: 虚拟滚动网格组件（使用react-window）
import { useEffect, useState, useCallback, useRef } from 'react';
import { Grid } from 'react-window';
import type { CellComponentProps } from 'react-window';
import { Empty } from 'antd';
import { PhotoCard } from './PhotoCard';
import { useAppStore, usePhotoStore, useSettingsStore } from '@/stores';
import type { Photo } from '@/api/photos';
import './PhotoGrid.css';

interface PhotoGridProps {
  onPhotoClick?: (photo: Photo) => void;
}

// 定义传递给 Cell 组件的额外 props
interface CellExtraProps {
  photos: Photo[];
  selectedPhotoIds: Set<number>;
  thumbnailSize: 'small' | 'medium' | 'large';
  cardGap: number;
  columnCount: number;
  handlePhotoSelect: (id: number, selected: boolean, event?: React.MouseEvent) => void;
  onPhotoClick?: (photo: Photo) => void;
}

// Cell 组件
const Cell = ({
  columnIndex,
  rowIndex,
  style,
  photos,
  selectedPhotoIds,
  thumbnailSize,
  cardGap,
  columnCount,
  handlePhotoSelect,
  onPhotoClick,
}: CellComponentProps<CellExtraProps>) => {
  const index = rowIndex * columnCount + columnIndex;
  const photo = photos[index];

  if (!photo) {
    return <div style={style} />;
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
        size={thumbnailSize}
        onSelect={(id, selected) => handlePhotoSelect(id, selected)}
        onClick={onPhotoClick}
      />
    </div>
  );
};

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

  if (photos.length === 0) {
    return (
      <div className="photo-grid-empty">
        <Empty description="暂无照片" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  const columnCount = getColumnCount(dimensions.width);
  const rowCount = getRowCount(columnCount);

  // 准备传递给 Cell 的额外 props
  const cellProps: CellExtraProps = {
    photos,
    selectedPhotoIds,
    thumbnailSize: thumbnailSize || 'medium',
    cardGap,
    columnCount,
    handlePhotoSelect,
    onPhotoClick,
  };

  return (
    <div className="photo-grid-container" ref={containerRef}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Grid
          cellComponent={Cell}
          cellProps={cellProps}
          columnCount={columnCount}
          columnWidth={totalCardSize}
          rowCount={rowCount}
          rowHeight={totalCardSize}
          overscanCount={2}
          className="photo-grid"
          style={{ width: dimensions.width, height: dimensions.height }}
        />
      )}
    </div>
  );
}
