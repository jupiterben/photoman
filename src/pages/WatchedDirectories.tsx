// Watched directories management page
// T199: 实现监控目录管理页面

import React from 'react';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { WatchedDirectoryList } from '@/components/WatchedDirectoryList';
import './WatchedDirectories.css';

const { Title } = Typography;

export const WatchedDirectories: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="watched-directories-page">
      <Title level={2}>{t('watcher.pageTitle', '监控目录管理')}</Title>
      <p className="page-description">
        {t(
          'watcher.pageDescription',
          '添加目录以自动监控和同步图片，系统会实时检测文件变化。'
        )}
      </p>
      <WatchedDirectoryList />
    </div>
  );
};

