/**
 * Top toolbar component
 */
import { Layout, Input, Button, Space, Dropdown } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  BulbOutlined,
  BulbFilled,
  GlobalOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './Toolbar.css';

const { Header } = Layout;

interface ToolbarProps {
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  onLanguageChange?: (lang: string) => void;
  currentLanguage?: string;
}

function Toolbar({
  onThemeToggle,
  isDarkMode = false,
  onLanguageChange,
  currentLanguage = 'zh-CN',
}: ToolbarProps) {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    onLanguageChange?.(lang);
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
        <Input
          prefix={<SearchOutlined />}
          placeholder={t('toolbar.search', '搜索图片...')}
          className="search-input"
          allowClear
        />
      </div>
      <div className="toolbar-right">
        <Space size="middle">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              // Will implement in Phase 3
              console.log('Import photos');
            }}
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
    </Header>
  );
}

export default Toolbar;
