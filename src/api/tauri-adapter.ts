/**
 * Electron API 适配器
 * 提供统一的 API 调用接口
 */

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
 * 调用 Electron 后端命令
 */
export async function invoke<T = unknown>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  try {
    return await window.electronAPI.invoke<T>(command, args);
  } catch (error) {
    // 统一错误格式
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  }
}

/**
 * 监听 Electron 事件
 */
export function listen<T = unknown>(event: string, handler: (payload: T) => void): () => void {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  return window.electronAPI.on<T>(event, handler);
}

/**
 * 检查 Electron API 是否可用
 */
export function isAPIAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI;
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
  return await invoke<string | string[] | null>(
    'show_open_dialog',
    options as Record<string, unknown>
  );
}

// ==================== 文件路径转换 ====================

/**
 * 转换文件路径为可用的 URL
 * 使用 file:// 协议
 */
export function convertFileSrc(filePath: string): string {
  // 规范化路径分隔符为正斜杠
  const normalized = filePath.replace(/\\/g, '/');
  // 添加 file:// 协议前缀
  return `file://${normalized.startsWith('/') ? '' : '/'}${normalized}`;
}
