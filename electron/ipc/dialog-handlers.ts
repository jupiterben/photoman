import { dialog, BrowserWindow } from 'electron';
import type { IPCCommand, IPCCommandArgs, IPCCommandReturns } from '../types/ipc-commands';

type RegisterHandlerFn = <T extends IPCCommand>(
  command: T,
  handler: (args: IPCCommandArgs<T>) => Promise<IPCCommandReturns<T>>
) => void;

/**
 * 文件对话框选项
 */
interface OpenDialogOptions {
  directory?: boolean;
  multiple?: boolean;
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

/**
 * 注册对话框相关的IPC命令
 */
export function registerDialogHandlers(registerHandler: RegisterHandlerFn) {
  console.log('[IPC] Registering dialog handlers...');

  // 显示打开文件/文件夹对话框
  registerHandler('show_open_dialog' as any, async (options?: OpenDialogOptions) => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      throw new Error('No window available');
    }

    const properties: Array<
      'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'
    > = [];

    if (options?.directory) {
      properties.push('openDirectory');
    } else {
      properties.push('openFile');
    }

    if (options?.multiple) {
      properties.push('multiSelections');
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      title: options?.title,
      defaultPath: options?.defaultPath,
      filters: options?.filters,
      properties,
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    // 如果是单选，返回字符串；多选返回数组
    return options?.multiple ? result.filePaths : result.filePaths[0];
  });

  console.log('[IPC] Dialog handlers registered.');
}

