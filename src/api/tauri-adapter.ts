/**
 * Tauri/Electron 适配器
 * 根据运行环境自动选择正确的 invoke 实现
 */

// 检测是否在 Electron 环境
const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

// 定义 Electron API 类型
interface ElectronAPI {
  invoke<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T>;
  on<T = unknown>(channel: string, listener: (args: T) => void): () => void;
}

// 声明全局 window 类型扩展
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

/**
 * 统一的 invoke 函数
 * 在 Electron 环境下使用 window.electronAPI.invoke
 * 在 Tauri 环境下使用 @tauri-apps/api/core 的 invoke
 */
export async function invoke<T = unknown>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (isElectron && window.electronAPI) {
    // Electron 环境
    try {
      return await window.electronAPI.invoke<T>(command, args);
    } catch (error) {
      // 统一错误格式
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(String(error));
    }
  } else {
    // Tauri 环境 (动态导入以避免在 Electron 环境下加载 Tauri 依赖)
    try {
      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      return await tauriInvoke<T>(command, args);
    } catch (error) {
      // 如果 Tauri 模块不存在，说明配置有问题
      console.error('Neither Electron nor Tauri API available');
      throw new Error('Backend API not available');
    }
  }
}

/**
 * 统一的事件监听函数
 * 在 Electron 环境下使用 window.electronAPI.on
 * 在 Tauri 环境下使用 @tauri-apps/api/event 的 listen
 */
export async function listen<T = unknown>(
  event: string,
  handler: (payload: T) => void
): Promise<() => void> {
  if (isElectron && window.electronAPI) {
    // Electron 环境
    return window.electronAPI.on<T>(event, handler);
  } else {
    // Tauri 环境
    const { listen: tauriListen } = await import('@tauri-apps/api/event');
    const unlisten = await tauriListen<T>(event, (event) => {
      handler(event.payload);
    });
    return unlisten;
  }
}

/**
 * 获取当前运行环境
 */
export function getEnvironment(): 'electron' | 'tauri' | 'unknown' {
  if (isElectron) {
    return 'electron';
  }
  // 检测 Tauri 特有的全局变量
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    return 'tauri';
  }
  return 'unknown';
}

/**
 * 检查 API 是否可用
 */
export function isAPIAvailable(): boolean {
  const env = getEnvironment();
  return env === 'electron' || env === 'tauri';
}

// ==================== 文件对话框 ====================

export interface OpenDialogOptions {
  directory?: boolean;
  multiple?: boolean;
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

/**
 * 打开文件/文件夹选择对话框
 */
export async function open(options?: OpenDialogOptions): Promise<string | string[] | null> {
  if (isElectron && window.electronAPI) {
    // Electron 环境 - 通过 IPC 调用主进程的对话框
    const result = await invoke<string | string[] | null>('show_open_dialog', options as Record<string, unknown>);
    return result;
  } else {
    // Tauri 环境
    const { open: tauriOpen } = await import('@tauri-apps/plugin-dialog');
    return await tauriOpen(options);
  }
}

// ==================== 文件路径转换 ====================

/**
 * 转换文件路径为可用的 URL
 * 在 Electron 中，使用自定义协议或 file:// 协议
 * 在 Tauri 中，使用 convertFileSrc
 */
export function convertFileSrc(filePath: string, protocol = 'asset'): string {
  if (isElectron) {
    // Electron 环境 - 使用 file:// 协议
    // 注意：需要确保路径格式正确
    const normalized = filePath.replace(/\\/g, '/');
    return `file://${normalized.startsWith('/') ? '' : '/'}${normalized}`;
  } else {
    // Tauri 环境 - 需要动态导入（但由于这是同步函数，我们先返回原始路径）
    // 在实际使用中，Tauri 的 convertFileSrc 会被正确调用
    try {
      // 尝试加载 Tauri 的 convertFileSrc（如果可用）
      // 这里我们假设在 Tauri 环境下，convertFileSrc 已经可用
      const { convertFileSrc: tauriConvert } = require('@tauri-apps/api/core');
      return tauriConvert(filePath, protocol);
    } catch {
      // 如果无法加载，返回原始路径
      return filePath;
    }
  }
}

