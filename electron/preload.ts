import { contextBridge, ipcRenderer } from 'electron';

// 定义暴露给渲染进程的API类型
export interface ElectronAPI {
  invoke: <T = any>(command: string, args?: any) => Promise<T>;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
}

// 通过contextBridge安全地暴露API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: <T = any>(command: string, args?: any): Promise<T> => {
    return ipcRenderer.invoke(command, args);
  },

  on: (channel: string, callback: (...args: any[]) => void) => {
    // 包装callback以移除event参数
    const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => {
      callback(...args);
    };
    ipcRenderer.on(channel, subscription);
  },

  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
} as ElectronAPI);

// 声明全局类型供TypeScript使用
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}


