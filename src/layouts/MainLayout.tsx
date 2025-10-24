/**
 * Main layout component
 * Provides the overall app structure with sidebar and content area
 */
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Toolbar from '@/components/Toolbar';
import { useApp } from '@/contexts/AppContext';
import './MainLayout.css';

const { Content } = Layout;

function MainLayout() {
  const { isDarkMode, toggleTheme, currentLanguage, changeLanguage } = useApp();

  return (
    <Layout className="main-layout">
      <Sidebar />
      <Layout className="main-layout-content">
        <Toolbar
          onThemeToggle={toggleTheme}
          isDarkMode={isDarkMode}
          onLanguageChange={changeLanguage}
          currentLanguage={currentLanguage}
        />
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
