// T105: 标签显示组件
import { Tag } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { Tag as TagType } from '@/api/tags';

interface TagChipProps {
  tag: TagType;
  closable?: boolean;
  onClose?: (tag: TagType) => void;
  onClick?: (tag: TagType) => void;
}

export function TagChip({ tag, closable, onClose, onClick }: TagChipProps) {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose?.(tag);
  };

  const handleClick = () => {
    onClick?.(tag);
  };

  return (
    <Tag
      color={tag.color || 'default'}
      closable={closable}
      closeIcon={<CloseOutlined />}
      onClose={handleClose}
      onClick={onClick ? handleClick : undefined}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        marginBottom: 8,
      }}
    >
      {tag.name}
      {tag.usage_count > 0 && (
        <span style={{ marginLeft: 4, opacity: 0.7 }}>({tag.usage_count})</span>
      )}
    </Tag>
  );
}
