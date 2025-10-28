// Watch directory card component
// T196: 实现监控目录卡片组件

import React from 'react';
import { Card, Tag, Button, Space, Tooltip, Dropdown } from 'antd';
import {
  FolderOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EllipsisOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { WatchedDirectory, WatchedDirectoryStats } from '@/api/watcher';
import { useTranslation } from 'react-i18next';
import './WatchDirectoryCard.css';

interface WatchDirectoryCardProps {
  directory: WatchedDirectory;
  stats?: WatchedDirectoryStats;
  onPause?: (id: number) => void;
  onResume?: (id: number) => void;
  onRescan?: (id: number) => void;
  onRemove?: (id: number) => void;
}

export const WatchDirectoryCard: React.FC<WatchDirectoryCardProps> = ({
  directory,
  stats,
  onPause,
  onResume,
  onRescan,
  onRemove,
}) => {
  const { t } = useTranslation();

  const getStatusTag = () => {
    switch (directory.status) {
      case 'active':
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            {t('watcher.status.active', '运行中')}
          </Tag>
        );
      case 'paused':
        return (
          <Tag icon={<PauseCircleOutlined />} color="default">
            {t('watcher.status.paused', '已暂停')}
          </Tag>
        );
      case 'error':
        return (
          <Tooltip title={directory.error_message}>
            <Tag icon={<ExclamationCircleOutlined />} color="error">
              {t('watcher.status.error', '错误')}
            </Tag>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  const menuItems = [
    directory.status === 'active'
      ? {
          key: 'pause',
          label: t('watcher.actions.pause', '暂停监控'),
          icon: <PauseCircleOutlined />,
          onClick: () => directory.id && onPause?.(directory.id),
        }
      : {
          key: 'resume',
          label: t('watcher.actions.resume', '恢复监控'),
          icon: <PlayCircleOutlined />,
          onClick: () => directory.id && onResume?.(directory.id),
        },
    {
      key: 'rescan',
      label: t('watcher.actions.rescan', '重新扫描'),
      icon: <ReloadOutlined />,
      onClick: () => directory.id && onRescan?.(directory.id),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'remove',
      label: t('watcher.actions.remove', '移除监控'),
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => directory.id && onRemove?.(directory.id),
    },
  ];

  return (
    <Card
      className="watch-directory-card"
      size="small"
      hoverable
      title={
        <Space>
          <FolderOutlined />
          <Tooltip title={directory.directory_path}>
            <span className="directory-path">{directory.directory_path}</span>
          </Tooltip>
        </Space>
      }
      extra={
        <Space>
          {getStatusTag()}
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" icon={<EllipsisOutlined />} size="small" />
          </Dropdown>
        </Space>
      }
    >
      <div className="card-content">
        <div className="info-row">
          <span className="label">
            {t('watcher.recursive', '递归监控')}:
          </span>
          <span className="value">
            {directory.recursive
              ? t('watcher.yes', '是')
              : t('watcher.no', '否')}
          </span>
        </div>

        {stats && (
          <>
            <div className="info-row">
              <span className="label">
                {t('watcher.photoCount', '图片数量')}:
              </span>
              <span className="value">
                {stats.active_photos} / {stats.photo_count}
              </span>
            </div>

            <div className="info-row">
              <span className="label">
                {t('watcher.scanCount', '扫描次数')}:
              </span>
              <span className="value">{stats.scan_count}</span>
            </div>

            {stats.last_synced_at && (
              <div className="info-row">
                <span className="label">
                  {t('watcher.lastSynced', '最后同步')}:
                </span>
                <span className="value">
                  {new Date(stats.last_synced_at).toLocaleString()}
                </span>
              </div>
            )}
          </>
        )}

        {directory.status === 'error' && directory.error_message && (
          <div className="error-message">
            <ExclamationCircleOutlined /> {directory.error_message}
          </div>
        )}
      </div>
    </Card>
  );
};

