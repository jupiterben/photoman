/**
 * 应用全局状态Store
 * T046: 实现应用状态store
 */

import { create } from 'zustand';

export type ViewMode = 'grid' | 'list' | 'detail';
export type SidebarTab = 'all' | 'favorites' | 'albums' | 'tags' | 'recycle';

interface AppState {
  // 视图状态
  viewMode: ViewMode;
  sidebarCollapsed: boolean;
  currentSidebarTab: SidebarTab;

  // 选择状态
  selectedPhotoIds: Set<number>;
  lastSelectedPhotoId: number | null;

  // 加载状态
  isLoading: boolean;
  loadingMessage: string;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  setSidebarTab: (tab: SidebarTab) => void;

  selectPhoto: (id: number, multi?: boolean) => void;
  selectPhotoRange: (startId: number, endId: number, allIds: number[]) => void;
  clearSelection: () => void;
  togglePhotoSelection: (id: number) => void;

  setLoading: (loading: boolean, message?: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // 初始状态
  viewMode: 'grid',
  sidebarCollapsed: false,
  currentSidebarTab: 'all',

  selectedPhotoIds: new Set(),
  lastSelectedPhotoId: null,

  isLoading: false,
  loadingMessage: '',

  // Actions实现
  setViewMode: (mode) => set({ viewMode: mode }),

  toggleSidebar: () =>
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed,
    })),

  setSidebarTab: (tab) =>
    set({
      currentSidebarTab: tab,
      selectedPhotoIds: new Set(), // 切换tab时清空选择
    }),

  selectPhoto: (id, multi = false) => {
    if (multi) {
      set((state) => {
        const newSelection = new Set(state.selectedPhotoIds);
        newSelection.add(id);
        return {
          selectedPhotoIds: newSelection,
          lastSelectedPhotoId: id,
        };
      });
    } else {
      set({
        selectedPhotoIds: new Set([id]),
        lastSelectedPhotoId: id,
      });
    }
  },

  selectPhotoRange: (startId, endId, allIds) => {
    const startIndex = allIds.indexOf(startId);
    const endIndex = allIds.indexOf(endId);

    if (startIndex === -1 || endIndex === -1) return;

    const [min, max] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];

    const rangeIds = allIds.slice(min, max + 1);

    set((state) => ({
      selectedPhotoIds: new Set([...state.selectedPhotoIds, ...rangeIds]),
      lastSelectedPhotoId: endId,
    }));
  },

  clearSelection: () =>
    set({
      selectedPhotoIds: new Set(),
      lastSelectedPhotoId: null,
    }),

  togglePhotoSelection: (id) => {
    set((state) => {
      const newSelection = new Set(state.selectedPhotoIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedPhotoIds: newSelection };
    });
  },

  setLoading: (loading, message = '') =>
    set({
      isLoading: loading,
      loadingMessage: message,
    }),
}));
