/**
 * Application context for sharing global state
 * T048: 实现状态持久化（localStorage）
 *
 * 此 Context 作为桥接层，连接 Zustand stores 和 React 组件
 */
import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, Theme, Language } from '@/stores';

interface AppContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { theme, language, setTheme, setLanguage } = useSettingsStore();
  const { i18n } = useTranslation();

  // 计算当前是否为暗色模式
  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // 初始化语言设置
  useEffect(() => {
    if (language !== i18n.language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  // 应用主题到 DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // 监听系统主题变化
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const newIsDark = mediaQuery.matches;
      document.documentElement.setAttribute('data-theme', newIsDark ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme: Theme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const changeLanguage = (lang: string) => {
    const validLang = lang === 'zh-CN' || lang === 'en-US' ? (lang as Language) : 'zh-CN';
    setLanguage(validLang);
    i18n.changeLanguage(validLang);
  };

  return (
    <AppContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        currentLanguage: language,
        changeLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
