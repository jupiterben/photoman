// T108: 标签状态管理
import { create } from 'zustand';
import type { Tag } from '@/api/tags';

interface TagState {
  // 标签列表
  tags: Tag[];
  selectedTags: Set<number>;
  filterMode: 'any' | 'all'; // OR | AND

  // 加载状态
  loading: boolean;
  error: string | null;

  // Actions
  setTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  updateTag: (id: number, updates: Partial<Tag>) => void;
  removeTag: (id: number) => void;

  selectTag: (id: number) => void;
  deselectTag: (id: number) => void;
  toggleTag: (id: number) => void;
  clearSelection: () => void;

  setFilterMode: (mode: 'any' | 'all') => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTagStore = create<TagState>((set) => ({
  // Initial state
  tags: [],
  selectedTags: new Set(),
  filterMode: 'any',
  loading: false,
  error: null,

  // Tag list management
  setTags: (tags) => set({ tags }),

  addTag: (tag) =>
    set((state) => ({
      tags: [...state.tags, tag].sort((a, b) => a.name.localeCompare(b.name)),
    })),

  updateTag: (id, updates) =>
    set((state) => ({
      tags: state.tags.map((tag) => (tag.id === id ? { ...tag, ...updates } : tag)),
    })),

  removeTag: (id) =>
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id),
      selectedTags: new Set([...state.selectedTags].filter((tid) => tid !== id)),
    })),

  // Tag selection
  selectTag: (id) =>
    set((state) => ({
      selectedTags: new Set([...state.selectedTags, id]),
    })),

  deselectTag: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedTags);
      newSelection.delete(id);
      return { selectedTags: newSelection };
    }),

  toggleTag: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedTags);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedTags: newSelection };
    }),

  clearSelection: () => set({ selectedTags: new Set() }),

  // Filter mode
  setFilterMode: (mode) => set({ filterMode: mode }),

  // Loading state
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
