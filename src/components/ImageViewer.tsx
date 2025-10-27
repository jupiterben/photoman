// T084: 图片缩放和平移组件
import { useState, useRef, useEffect, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Button, Space, Spin } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  UndoOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import './ImageViewer.css';

interface ImageViewerProps {
  src: string;
  alt?: string;
  loading?: boolean;
}

export function ImageViewer({ src, alt = '', loading = false }: ImageViewerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const transformRef = useRef<any>(null);

  useEffect(() => {
    setImageLoaded(false);
  }, [src]);

  const handleReset = useCallback(() => {
    transformRef.current?.resetTransform();
  }, []);

  const handleZoomIn = useCallback(() => {
    transformRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    transformRef.current?.zoomOut();
  }, []);

  const handleFullscreen = useCallback(() => {
    const element = document.querySelector('.image-viewer-container');
    if (element) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        element.requestFullscreen();
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="image-viewer-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="image-viewer-container">
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.1}
        maxScale={10}
        wheel={{ step: 0.1 }}
        doubleClick={{ mode: 'reset' }}
      >
        <TransformComponent wrapperClass="image-viewer-wrapper" contentClass="image-viewer-content">
          <img
            src={src}
            alt={alt}
            className="image-viewer-image"
            onLoad={() => setImageLoaded(true)}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
          {!imageLoaded && (
            <div className="image-viewer-loading">
              <Spin size="large" />
            </div>
          )}
        </TransformComponent>
      </TransformWrapper>

      <div className="image-viewer-controls">
        <Space>
          <Button icon={<ZoomInOutlined />} onClick={handleZoomIn}>
            放大
          </Button>
          <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut}>
            缩小
          </Button>
          <Button icon={<UndoOutlined />} onClick={handleReset}>
            重置
          </Button>
          <Button icon={<FullscreenOutlined />} onClick={handleFullscreen}>
            全屏
          </Button>
        </Space>
      </div>
    </div>
  );
}
