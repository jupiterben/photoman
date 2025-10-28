/**
 * Sidebar navigation component
 */
import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  PictureOutlined,
  TagsOutlined,
  FolderOutlined,
  HeartOutlined,
  DeleteOutlined,
  SettingOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';

const { Sider } = Layout;

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: t('sidebar.home', '首页'),
    },
    {
      key: '/photos',
      icon: <PictureOutlined />,
      label: t('sidebar.allPhotos', '所有图片'),
    },
    {
      key: '/favorites',
      icon: <HeartOutlined />,
      label: t('sidebar.favorites', '收藏'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: '/watched-directories',
      icon: <FolderOpenOutlined />,
      label: t('sidebar.watchedDirectories', '监控目录'),
    },
    {
      key: '/tags',
      icon: <TagsOutlined />,
      label: t('sidebar.tags', '标签'),
    },
    {
      key: '/albums',
      icon: <FolderOutlined />,
      label: t('sidebar.albums', '相册'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: '/trash',
      icon: <DeleteOutlined />,
      label: t('sidebar.trash', '回收站'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('sidebar.settings', '设置'),
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Sider className="app-sidebar" width={240} theme="light" collapsible collapsedWidth={80}>
      <div className="sidebar-logo">
        <PictureOutlined className="logo-icon" />
        <span className="logo-text">PhotoMan</span>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  );
}

export default Sidebar;
