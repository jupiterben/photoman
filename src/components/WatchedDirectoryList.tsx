// Watched directory list component
// T194: 实现监控目录列表组件

import React, { useEffect, useState } from 'react';
import { Space, Button, Empty, Spin, Alert, Modal } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { WatchDirectoryCard } from './WatchDirectoryCard';
import { AddWatchDirectoryDialog } from './AddWatchDirectoryDialog';
import { useWatcherStore } from '@/stores/watcherStore';
import './WatchedDirectoryList.css';

export const WatchedDirectoryList: React.FC = () => {
  const { t } = useTranslation();
  const {
    directories,
    stats,
    loading,
    error,
    loadDirectories,
    loadStats,
    addDirectory,
    pauseDirectory,
    resumeDirectory,
    rescanDirectory,
    removeDirectory,
    clearError,
    startListening,
  } = useWatcherStore();

  const [addDialogVisible, setAddDialogVisible] = useState(false);

  // 初始化加载
  useEffect(() => {
    loadDirectories();
    loadStats();
    startListening();
  }, []);

  const handleRefresh = async () => {
    await loadDirectories();
    await loadStats();
  };

  const handleAddDirectory = async (path: string, recursive: boolean) => {
    await addDirectory(path, recursive);
  };

  const handleRemove = (id: number) => {
    Modal.confirm({
      title: t('watcher.confirm.remove.title', '确认移除'),
      content: t('watcher.confirm.remove.content', '确定要移除此监控目录吗？目录中的图片不会被删除。'),
      icon: <ExclamationCircleOutlined />,
      okText: t('common.confirm', '确定'),
      cancelText: t('common.cancel', '取消'),
      okType: 'danger',
      onOk: async () => {
        await removeDirectory(id);
      },
    });
  };

  return (
    <div className="watched-directory-list">
      <div className="list-header">
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddDialogVisible(true)}
          >
            {t('watcher.addDirectory', '添加监控目录')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            {t('common.refresh', '刷新')}
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          closable
          onClose={clearError}
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading}>
        {directories.length === 0 ? (
          <Empty
            description={t('watcher.noDirectories', '暂无监控目录')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddDialogVisible(true)}
            >
              {t('watcher.addFirstDirectory', '添加第一个监控目录')}
            </Button>
          </Empty>
        ) : (
          <div className="directory-grid">
            {directories.map((dir) =>
              dir.id ? (
                <WatchDirectoryCard
                  key={dir.id}
                  directory={dir}
                  stats={stats.get(dir.id)}
                  onPause={pauseDirectory}
                  onResume={resumeDirectory}
                  onRescan={rescanDirectory}
                  onRemove={handleRemove}
                />
              ) : null
            )}
          </div>
        )}
      </Spin>

      <AddWatchDirectoryDialog
        visible={addDialogVisible}
        onClose={() => setAddDialogVisible(false)}
        onAdd={handleAddDirectory}
      />
    </div>
  );
};

