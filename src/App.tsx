import { useEffect } from 'react';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import { RouterProvider } from 'react-router-dom';
import router from '@/router';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { invoke } from '@/api/tauri-adapter';
import './App.css';

function AppContent() {
  const { isDarkMode } = useApp();

  useEffect(() => {
    // Initialize database check
    const loadInfo = async () => {
      try {
        const info = await invoke('ping');
        console.log('Backend connected:', info);
      } catch (error) {
        console.error('Backend connection failed:', error);
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
