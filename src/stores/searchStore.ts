// T127: 搜索状态管理
import { create } from 'zustand';
import { SearchQuery, SearchResult } from '@/api/search';

/**
 * 搜索历史项
 */
export interface SearchHistoryItem {
  id: string;
  query: SearchQuery;
  timestamp: number;
  resultCount: number;
}

/**
 * 智能相册（保存的搜索）
 */
export interface SmartAlbum {
  id: string;
  name: string;
  query: SearchQuery;
  createdAt: number;
}

interface SearchState {
  // 当前搜索查询
  currentQuery: SearchQuery | null;
  
  // 搜索结果
  searchResult: SearchResult | null;
  
  // 搜索中
  isSearching: boolean;
  
  // 搜索历史（最多保存20条）
  searchHistory: SearchHistoryItem[];
  
  // 智能相册
  smartAlbums: SmartAlbum[];
  
  // Actions
  setCurrentQuery: (query: SearchQuery | null) => void;
  setSearchResult: (result: SearchResult | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  
  // 搜索历史
  addSearchHistory: (query: SearchQuery, resultCount: number) => void;
  clearSearchHistory: () => void;
  removeSearchHistoryItem: (id: string) => void;
  
  // 智能相册
  addSmartAlbum: (name: string, query: SearchQuery) => void;
  removeSmartAlbum: (id: string) => void;
  updateSmartAlbum: (id: string, name: string, query: SearchQuery) => void;
  
  // 重置
  resetSearch: () => void;
}

const MAX_HISTORY_ITEMS = 20;

export const useSearchStore = create<SearchState>((set, get) => ({
  currentQuery: null,
  searchResult: null,
  isSearching: false,
  searchHistory: [],
  smartAlbums: [],
  
  setCurrentQuery: (query) => set({ currentQuery: query }),
  
  setSearchResult: (result) => set({ searchResult: result }),
  
  setIsSearching: (isSearching) => set({ isSearching }),
  
  addSearchHistory: (query, resultCount) => {
    const history = get().searchHistory;
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query,
      timestamp: Date.now(),
      resultCount,
    };
    
    // 添加到历史记录，保持最多20条
    const newHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    set({ searchHistory: newHistory });
    
    // 持久化到localStorage
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  },
  
  clearSearchHistory: () => {
    set({ searchHistory: [] });
    localStorage.removeItem('search_history');
  },
  
  removeSearchHistoryItem: (id) => {
    const newHistory = get().searchHistory.filter(item => item.id !== id);
    set({ searchHistory: newHistory });
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  },
  
  addSmartAlbum: (name, query) => {
    const albums = get().smartAlbums;
    const newAlbum: SmartAlbum = {
      id: Date.now().toString(),
      name,
      query,
      createdAt: Date.now(),
    };
    
    const newAlbums = [...albums, newAlbum];
    set({ smartAlbums: newAlbums });
    
    // 持久化到localStorage
    localStorage.setItem('smart_albums', JSON.stringify(newAlbums));
  },
  
  removeSmartAlbum: (id) => {
    const newAlbums = get().smartAlbums.filter(album => album.id !== id);
    set({ smartAlbums: newAlbums });
    localStorage.setItem('smart_albums', JSON.stringify(newAlbums));
  },
  
  updateSmartAlbum: (id, name, query) => {
    const albums = get().smartAlbums;
    const newAlbums = albums.map(album => 
      album.id === id ? { ...album, name, query } : album
    );
    set({ smartAlbums: newAlbums });
    localStorage.setItem('smart_albums', JSON.stringify(newAlbums));
  },
  
  resetSearch: () => {
    set({
      currentQuery: null,
      searchResult: null,
      isSearching: false,
    });
  },
}));

// 初始化时从localStorage加载
const loadPersistedData = () => {
  try {
    const historyStr = localStorage.getItem('search_history');
    if (historyStr) {
      const history = JSON.parse(historyStr);
      useSearchStore.setState({ searchHistory: history });
    }
    
    const albumsStr = localStorage.getItem('smart_albums');
    if (albumsStr) {
      const albums = JSON.parse(albumsStr);
      useSearchStore.setState({ smartAlbums: albums });
    }
  } catch (error) {
    console.error('Failed to load persisted search data:', error);
  }
};

// 在模块加载时初始化
if (typeof window !== 'undefined') {
  loadPersistedData();
}














