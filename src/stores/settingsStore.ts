/**
 * 设置状态Store
 * T047: 实现设置状态store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'zh-CN' | 'en-US';
export type ThumbnailSize = 'small' | 'medium' | 'large';

interface SettingsState {
  // 外观设置
  theme: Theme;
  language: Language;
  thumbnailSize: ThumbnailSize;

  // 扫描设置
  scanRecursive: boolean;
  scanHiddenFiles: boolean;
  autoIncrementalScan: boolean;

  // 缓存设置
  cacheSizeLimit: number; // 字节
  cacheLocation: string;

  // 回收站设置
  recycleBinDays: number; // 天数

  // 备份设置
  autoBackup: boolean;
  backupDay: string; // 'sunday' | 'monday' | ...
  backupTime: string; // 'HH:mm'

  // Actions
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setThumbnailSize: (size: ThumbnailSize) => void;

  setScanRecursive: (value: boolean) => void;
  setScanHiddenFiles: (value: boolean) => void;
  setAutoIncrementalScan: (value: boolean) => void;

  setCacheSizeLimit: (bytes: number) => void;
  setCacheLocation: (path: string) => void;

  setRecycleBinDays: (days: number) => void;

  setAutoBackup: (enabled: boolean) => void;
  setBackupSchedule: (day: string, time: string) => void;

  resetToDefaults: () => void;
}

const defaultSettings = {
  theme: 'system' as Theme,
  language: 'zh-CN' as Language,
  thumbnailSize: 'medium' as ThumbnailSize,

  scanRecursive: true,
  scanHiddenFiles: false,
  autoIncrementalScan: true,

  cacheSizeLimit: 5 * 1024 * 1024 * 1024, // 5GB
  cacheLocation: '',

  recycleBinDays: 30,

  autoBackup: true,
  backupDay: 'sunday',
  backupTime: '02:00',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      // Actions实现
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setThumbnailSize: (size) => set({ thumbnailSize: size }),

      setScanRecursive: (value) => set({ scanRecursive: value }),
      setScanHiddenFiles: (value) => set({ scanHiddenFiles: value }),
      setAutoIncrementalScan: (value) => set({ autoIncrementalScan: value }),

      setCacheSizeLimit: (bytes) => set({ cacheSizeLimit: bytes }),
      setCacheLocation: (path) => set({ cacheLocation: path }),

      setRecycleBinDays: (days) => set({ recycleBinDays: days }),

      setAutoBackup: (enabled) => set({ autoBackup: enabled }),
      setBackupSchedule: (day, time) =>
        set({
          backupDay: day,
          backupTime: time,
        }),

      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'photoman-settings', // localStorage key
      version: 1,
    }
  )
);
