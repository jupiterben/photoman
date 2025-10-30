// Watcher store using Zustand
// T198: 实现监控目录 Store

import { create } from 'zustand';
import {
  WatchedDirectory,
  WatchedDirectoryStats,
  addWatchedDirectory,
  removeWatchedDirectory,
  pauseWatchedDirectory,
  resumeWatchedDirectory,
  getWatchedDirectories,
  getAllWatchedDirectoryStats,
  rescanWatchedDirectory,
} from '@/api/watcher';
import { listen } from '@/api/tauri-adapter';

interface WatcherState {
  // 数据状态
  directories: WatchedDirectory[];
  stats: Map<number, WatchedDirectoryStats>;
  loading: boolean;
  error: string | null;

  // 操作方法
  loadDirectories: () => Promise<void>;
  loadStats: () => Promise<void>;
  addDirectory: (path: string, recursive: boolean) => Promise<number>;
  removeDirectory: (id: number) => Promise<void>;
  pauseDirectory: (id: number) => Promise<void>;
  resumeDirectory: (id: number) => Promise<void>;
  rescanDirectory: (id: number) => Promise<void>;
  
  // 辅助方法
  getDirectoryById: (id: number) => WatchedDirectory | undefined;
  getStatsById: (id: number) => WatchedDirectoryStats | undefined;
  clearError: () => void;
  
  // 实时监听
  startListening: () => void;
  stopListening: () => (() => void) | null;
}

// 文件系统事件监听解绑函数
let unlistenFileSystem: (() => void) | null = null;

export const useWatcherStore = create<WatcherState>((set, get) => ({
  // 初始状态
  directories: [],
  stats: new Map(),
  loading: false,
  error: null,

  // 加载监控目录列表
  loadDirectories: async () => {
    set({ loading: true, error: null });
    try {
      const directories = await getWatchedDirectories();
      set({ directories, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加载监控目录失败',
        loading: false,
      });
    }
  },

  // 加载统计信息
  loadStats: async () => {
    try {
      const allStats = await getAllWatchedDirectoryStats();
      const statsMap = new Map<number, WatchedDirectoryStats>();
      allStats.forEach((stat) => statsMap.set(stat.id, stat));
      set({ stats: statsMap });
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  },

  // 添加监控目录
  addDirectory: async (path: string, recursive: boolean) => {
    set({ loading: true, error: null });
    try {
      const id = await addWatchedDirectory(path, recursive);
      
      // 重新加载列表和统计
      await get().loadDirectories();
      await get().loadStats();
      
      set({ loading: false });
      return id;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '添加监控目录失败';
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  // 移除监控目录
  removeDirectory: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await removeWatchedDirectory(id);
      
      // 从本地状态移除
      set((state) => ({
        directories: state.directories.filter((d) => d.id !== id),
        loading: false,
      }));
      
      // 重新加载统计
      await get().loadStats();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '移除监控目录失败',
        loading: false,
      });
      throw error;
    }
  },

  // 暂停监控目录
  pauseDirectory: async (id: number) => {
    set({ error: null });
    try {
      await pauseWatchedDirectory(id);
      
      // 更新本地状态
      set((state) => ({
        directories: state.directories.map((d) =>
          d.id === id ? { ...d, status: 'paused' as const } : d
        ),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '暂停监控失败',
      });
      throw error;
    }
  },

  // 恢复监控目录
  resumeDirectory: async (id: number) => {
    set({ error: null });
    try {
      await resumeWatchedDirectory(id);
      
      // 更新本地状态
      set((state) => ({
        directories: state.directories.map((d) =>
          d.id === id ? { ...d, status: 'active' as const, error_message: null } : d
        ),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '恢复监控失败',
      });
      throw error;
    }
  },

  // 重新扫描监控目录
  rescanDirectory: async (id: number) => {
    set({ error: null });
    try {
      await rescanWatchedDirectory(id);
      // 触发重新加载统计
      await get().loadStats();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '重新扫描失败',
      });
      throw error;
    }
  },

  // 根据 ID 获取目录
  getDirectoryById: (id: number) => {
    return get().directories.find((d) => d.id === id);
  },

  // 根据 ID 获取统计
  getStatsById: (id: number) => {
    return get().stats.get(id);
  },

  // 清除错误
  clearError: () => set({ error: null }),

  // 开始监听文件系统事件
  startListening: () => {
    if (unlistenFileSystem) {
      return; // 已经在监听
    }

    try {
      unlistenFileSystem = listen<{ type: string; path: string }>(
        'file-system-event',
        (payload) => {
          console.log('文件系统事件:', payload);
          
          // 文件变化时重新加载统计
          const { loadStats } = get();
          loadStats();
        }
      );
      
      console.log('开始监听文件系统事件');
    } catch (error) {
      console.error('启动文件系统事件监听失败:', error);
    }
  },

  // 停止监听
  stopListening: () => {
    if (unlistenFileSystem) {
      unlistenFileSystem();
      unlistenFileSystem = null;
      console.log('停止监听文件系统事件');
    }
    return null;
  },
}));

