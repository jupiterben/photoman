// T159: 空状态设计组件
import './EmptyState.css';

export interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'photos' | 'tags' | 'albums' | 'trash';
}

const defaultContent = {
  default: {
    icon: '📂',
    title: '暂无内容',
    description: '这里还没有任何内容',
  },
  search: {
    icon: '🔍',
    title: '未找到结果',
    description: '尝试使用不同的关键词或调整筛选条件',
  },
  photos: {
    icon: '🖼️',
    title: '还没有照片',
    description: '点击"导入照片"按钮开始添加照片到您的图库',
  },
  tags: {
    icon: '🏷️',
    title: '还没有标签',
    description: '为照片添加标签，更好地组织您的图库',
  },
  albums: {
    icon: '📚',
    title: '还没有相册',
    description: '创建相册来整理您的照片',
  },
  trash: {
    icon: '🗑️',
    title: '回收站为空',
    description: '已删除的照片会显示在这里',
  },
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  const content = defaultContent[variant];
  const displayIcon = icon ?? content.icon;
  const displayTitle = title ?? content.title;
  const displayDescription = description ?? content.description;

  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <div className="empty-state-icon" role="img" aria-label="Empty state icon">
          {displayIcon}
        </div>
        <h3 className="empty-state-title">{displayTitle}</h3>
        <p className="empty-state-description">{displayDescription}</p>
        {action && (
          <button className="empty-state-action" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

