// T081: 照片store
import { create } from 'zustand';
import type { Photo } from '@/api/photos';

interface PhotoState {
  // 照片列表
  photos: Photo[];
  totalCount: number;
  currentPage: number;
  pageSize: number;

  // 加载状态
  isLoading: boolean;
  error: string | null;

  // Actions
  setPhotos: (photos: Photo[], total?: number) => void;
  addPhotos: (photos: Photo[]) => void;
  updatePhoto: (id: number, updates: Partial<Photo>) => void;
  removePhoto: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  clearPhotos: () => void;
}

export const usePhotoStore = create<PhotoState>((set) => ({
  photos: [],
  totalCount: 0,
  currentPage: 1,
  pageSize: 100,
  isLoading: false,
  error: null,

  setPhotos: (photos, total) =>
    set({
      photos,
      totalCount: total !== undefined ? total : photos.length,
    }),

  addPhotos: (newPhotos) =>
    set((state) => ({
      photos: [...state.photos, ...newPhotos],
      totalCount: state.totalCount + newPhotos.length,
    })),

  updatePhoto: (id, updates) =>
    set((state) => ({
      photos: state.photos.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  removePhoto: (id) =>
    set((state) => ({
      photos: state.photos.filter((p) => p.id !== id),
      totalCount: state.totalCount - 1,
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setPage: (page) => set({ currentPage: page }),

  clearPhotos: () => set({ photos: [], totalCount: 0, currentPage: 1 }),
}));
