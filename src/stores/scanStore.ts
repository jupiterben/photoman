// T074: 扫描状态管理
import { create } from 'zustand';
import type { ScanProgress, ScanResult } from '@/api/scanner';

interface ScanState {
  // 扫描状态
  isScanning: boolean;
  scanProgress: ScanProgress | null;
  scanResult: ScanResult | null;
  scanError: string | null;

  // Actions
  startScan: () => void;
  updateProgress: (progress: ScanProgress) => void;
  completeScan: (result: ScanResult) => void;
  failScan: (error: string) => void;
  resetScan: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  isScanning: false,
  scanProgress: null,
  scanResult: null,
  scanError: null,

  startScan: () =>
    set({
      isScanning: true,
      scanProgress: null,
      scanResult: null,
      scanError: null,
    }),

  updateProgress: (progress) => set({ scanProgress: progress }),

  completeScan: (result) =>
    set({
      isScanning: false,
      scanResult: result,
      scanError: null,
    }),

  failScan: (error) =>
    set({
      isScanning: false,
      scanError: error,
    }),

  resetScan: () =>
    set({
      isScanning: false,
      scanProgress: null,
      scanResult: null,
      scanError: null,
    }),
}));
