// T143: 回收站状态管理
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  softDeletePhotos,
  restorePhotos,
  permanentlyDeletePhotos,
  getRecycleBinPhotos,
  cleanExpiredRecycleBin,
  emptyRecycleBin,
  getRecycleBinStats,
  type Photo,
  type RecycleBinStats,
} from '../api/recycle';

interface RecycleState {
  // 回收站照片列表
  photos: Photo[];
  
  // 统计信息
  stats: RecycleBinStats | null;
  
  // 选中的照片 ID
  selectedIds: number[];
  
  // 加载状态
  isLoading: boolean;
  
  // 错误信息
  error: string | null;
  
  // 操作
  fetchPhotos: () => Promise<void>;
  fetchStats: () => Promise<void>;
  
  // 选择操作
  selectPhoto: (id: number) => void;
  unselectPhoto: (id: number) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // 删除和恢复操作
  deletePhotos: (photoIds: number[]) => Promise<void>;
  restore: (photoIds: number[]) => Promise<void>;
  permanentlyDelete: (photoIds: number[]) => Promise<void>;
  cleanExpired: (days?: number) => Promise<void>;
  empty: () => Promise<void>;
  
  // 重置状态
  reset: () => void;
}

export const useRecycleStore = create<RecycleState>()(
  persist(
    (set, get) => ({
      photos: [],
      stats: null,
      selectedIds: [],
      isLoading: false,
      error: null,
      
      fetchPhotos: async () => {
        set({ isLoading: true, error: null });
        try {
          const photos = await getRecycleBinPhotos();
          set({ photos, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : '获取回收站照片失败';
          set({ error: message, isLoading: false });
          console.error('Failed to fetch recycle bin photos:', error);
        }
      },
      
      fetchStats: async () => {
        try {
          const stats = await getRecycleBinStats();
          set({ stats });
        } catch (error) {
          console.error('Failed to fetch recycle bin stats:', error);
        }
      },
      
      selectPhoto: (id) => {
        const { selectedIds } = get();
        if (!selectedIds.includes(id)) {
          set({ selectedIds: [...selectedIds, id] });
        }
      },
      
      unselectPhoto: (id) => {
        const { selectedIds } = get();
        set({ selectedIds: selectedIds.filter(sid => sid !== id) });
      },
      
      selectAll: () => {
        const { photos } = get();
        set({ selectedIds: photos.map(p => p.id) });
      },
      
      clearSelection: () => {
        set({ selectedIds: [] });
      },
      
      deletePhotos: async (photoIds) => {
        set({ isLoading: true, error: null });
        try {
          await softDeletePhotos(photoIds);
          set({ isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : '删除照片失败';
          set({ error: message, isLoading: false });
          console.error('Failed to delete photos:', error);
          throw error;
        }
      },
      
      restore: async (photoIds) => {
        set({ isLoading: true, error: null });
        try {
          await restorePhotos(photoIds);
          
          // 从回收站列表中移除已恢复的照片
          const { photos, selectedIds } = get();
          const updatedPhotos = photos.filter(p => !photoIds.includes(p.id));
          const updatedSelection = selectedIds.filter(id => !photoIds.includes(id));
          
          set({
            photos: updatedPhotos,
            selectedIds: updatedSelection,
            isLoading: false,
          });
          
          // 更新统计
          get().fetchStats();
        } catch (error) {
          const message = error instanceof Error ? error.message : '恢复照片失败';
          set({ error: message, isLoading: false });
          console.error('Failed to restore photos:', error);
          throw error;
        }
      },
      
      permanentlyDelete: async (photoIds) => {
        set({ isLoading: true, error: null });
        try {
          await permanentlyDeletePhotos(photoIds);
          
          // 从回收站列表中移除已删除的照片
          const { photos, selectedIds } = get();
          const updatedPhotos = photos.filter(p => !photoIds.includes(p.id));
          const updatedSelection = selectedIds.filter(id => !photoIds.includes(id));
          
          set({
            photos: updatedPhotos,
            selectedIds: updatedSelection,
            isLoading: false,
          });
          
          // 更新统计
          get().fetchStats();
        } catch (error) {
          const message = error instanceof Error ? error.message : '永久删除失败';
          set({ error: message, isLoading: false });
          console.error('Failed to permanently delete photos:', error);
          throw error;
        }
      },
      
      cleanExpired: async (days = 30) => {
        set({ isLoading: true, error: null });
        try {
          await cleanExpiredRecycleBin(days);
          
          // 重新获取回收站列表
          await get().fetchPhotos();
          await get().fetchStats();
          
          set({ isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : '清理过期项目失败';
          set({ error: message, isLoading: false });
          console.error('Failed to clean expired items:', error);
          throw error;
        }
      },
      
      empty: async () => {
        set({ isLoading: true, error: null });
        try {
          await emptyRecycleBin();
          
          set({
            photos: [],
            selectedIds: [],
            stats: { count: 0, total_size: 0, oldest_deleted: null },
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : '清空回收站失败';
          set({ error: message, isLoading: false });
          console.error('Failed to empty recycle bin:', error);
          throw error;
        }
      },
      
      reset: () => {
        set({
          photos: [],
          stats: null,
          selectedIds: [],
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'recycle-storage',
      partialize: (state) => ({
        // 只持久化选择状态
        selectedIds: state.selectedIds,
      }),
    }
  )
);

