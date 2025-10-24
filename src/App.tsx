import { useEffect } from 'react';
import { ConfigProvider, theme, message as antdMessage, App as AntdApp } from 'antd';
import { RouterProvider } from 'react-router-dom';
import router from '@/router';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { getDatabaseInfo, PhotoManError } from '@/api/tauri';
import './App.css';

function AppContent() {
  const { isDarkMode } = useApp();

  useEffect(() => {
    // Initialize database info check
    const loadInfo = async () => {
      try {
        const info = await getDatabaseInfo();
        console.log('Database initialized:', info);
      } catch (error) {
        if (error instanceof PhotoManError) {
          antdMessage.error(`数据库错误: ${error.message}`);
        }
      }
    };

    loadInfo();
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AntdApp>
        <div className="app-root" data-theme={isDarkMode ? 'dark' : 'light'}>
          <RouterProvider router={router} />
        </div>
      </AntdApp>
    </ConfigProvider>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
