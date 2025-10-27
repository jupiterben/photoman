/**
 * Top toolbar component
 */
import { useState } from 'react';
import { Layout, Button, Space, Dropdown } from 'antd';
import {
  PlusOutlined,
  BulbOutlined,
  BulbFilled,
  GlobalOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useImportPhotos } from '@/hooks/useImportPhotos';
import { SearchBar } from './SearchBar';
import { AdvancedFilter } from './AdvancedFilter';
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
  const { startImport, isSelecting } = useImportPhotos();
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    onLanguageChange?.(lang);
  };

  const handleImportClick = async () => {
    await startImport(onImportComplete);
    // 扫描在后台进行，不需要等待
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
            onClick={handleImportClick}
            loading={isSelecting}
          >
            {t('toolbar.import', '导入图片')}
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
    </Header>
  );
}

export default Toolbar;
