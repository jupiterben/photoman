/**
 * Top toolbar component
 */
import { useState } from 'react';
import { Layout, Button, Space, Dropdown, message } from 'antd';
import {
  PlusOutlined,
  BulbOutlined,
  BulbFilled,
  GlobalOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { SearchBar } from './SearchBar';
import { AdvancedFilter } from './AdvancedFilter';
import { AddWatchDirectoryDialog } from './AddWatchDirectoryDialog';
import { useWatcherStore } from '@/stores/watcherStore';
import './Toolbar.css';

const { Header } = Layout;

interface ToolbarProps {
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  onLanguageChange?: (lang: string) => void;
  currentLanguage?: string;
  onImportComplete?: () => void;
}

function Toolbar({
  onThemeToggle,
  isDarkMode = false,
  onLanguageChange,
  currentLanguage = 'zh-CN',
  onImportComplete,
}: ToolbarProps) {
  const { t, i18n } = useTranslation();
  const { addDirectory } = useWatcherStore();
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    onLanguageChange?.(lang);
  };

  const handleAddWatchDirectory = async (path: string, recursive: boolean) => {
    setLoading(true);
    try {
      await addDirectory(path, recursive);
      message.success(t('watcher.dialog.addSuccess', '添加监控目录成功'));
      onImportComplete?.();
    } catch (error) {
      console.error('添加监控目录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const languageMenuItems = [
    {
      key: 'zh-CN',
      label: '简体中文',
      onClick: () => handleLanguageChange('zh-CN'),
    },
    {
      key: 'en-US',
      label: 'English',
      onClick: () => handleLanguageChange('en-US'),
    },
  ];

  return (
    <Header className="app-toolbar">
      <div className="toolbar-left">
        <SearchBar
          onAdvancedFilterClick={() => setAdvancedFilterOpen(true)}
          showAdvancedFilter={true}
        />
      </div>
      <div className="toolbar-right">
        <Space size="middle">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddDialogOpen(true)}
            loading={loading}
          >
            {t('toolbar.addWatchDirectory', '添加监控目录')}
          </Button>

          <Button
            type="text"
            icon={isDarkMode ? <BulbFilled /> : <BulbOutlined />}
            onClick={onThemeToggle}
            title={t('toolbar.toggleTheme', '切换主题')}
          />

          <Dropdown menu={{ items: languageMenuItems, selectedKeys: [currentLanguage] }}>
            <Button type="text" icon={<GlobalOutlined />} title={t('toolbar.language', '语言')} />
          </Dropdown>
        </Space>
      </div>

      {/* 高级筛选模态框 */}
      <AdvancedFilter
        open={advancedFilterOpen}
        onClose={() => setAdvancedFilterOpen(false)}
      />

      {/* 添加监控目录对话框 */}
      <AddWatchDirectoryDialog
        visible={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAddWatchDirectory}
      />
    </Header>
  );
}

export default Toolbar;
