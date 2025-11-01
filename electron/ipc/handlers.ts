import { ipcMain } from 'electron';
import type { IPCCommand, IPCCommandArgs, IPCCommandReturns } from '../types/ipc-commands';

// 存储已注册的处理器
const handlers = new Map<string, (args: any) => Promise<any>>();

/**
 * 注册IPC命令处理器
 */
export function registerHandler<T extends IPCCommand>(
  command: T,
  handler: (args: IPCCommandArgs<T>) => Promise<IPCCommandReturns<T>>
) {
  if (handlers.has(command)) {
    console.warn(`[IPC] Handler for command "${command}" is already registered. Overwriting.`);
  }

  handlers.set(command, handler as (args: any) => Promise<any>);

  ipcMain.handle(command, async (_event, args) => {
    try {
      console.log(`[IPC] Handling command: ${command}`, args ? `with args: ${JSON.stringify(args).substring(0, 100)}` : '');
      const result = await handler(args);
      return { success: true, data: result };
    } catch (error: any) {
      console.error(`[IPC] Error handling command "${command}":`, error);
      return {
        success: false,
        error: {
          message: error.message || 'Unknown error',
          code: error.code || 'UNKNOWN_ERROR',
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      };
    }
  });
}

/**
 * 注销IPC命令处理器
 */
export function unregisterHandler(command: IPCCommand) {
  if (handlers.has(command)) {
    ipcMain.removeHandler(command);
    handlers.delete(command);
    console.log(`[IPC] Handler for command "${command}" unregistered.`);
  }
}

/**
 * 注册所有IPC处理器
 */
export function registerHandlers() {
  console.log('[IPC] Registering handlers...');

  // 注册测试命令
  registerHandler('ping', async () => {
    return 'pong';
  });

  registerHandler('get_app_version', async () => {
    return process.env.npm_package_version || '1.0.0';
  });

  // 延迟导入以避免循环依赖
  const { registerDatabaseHandlers } = require('./database-handlers');
  const { registerScannerHandlers } = require('./scanner-handlers');
  const { registerDialogHandlers } = require('./dialog-handlers');
  const { registerWatcherHandlers } = require('./watcher-handlers');
  
  registerDatabaseHandlers(registerHandler);
  registerScannerHandlers(registerHandler);
  registerDialogHandlers(registerHandler);
  registerWatcherHandlers(registerHandler);

  console.log('[IPC] Handlers registered successfully.');
}

/**
 * 注销所有IPC处理器
 */
export function unregisterAllHandlers() {
  console.log('[IPC] Unregistering all handlers...');
  Array.from(handlers.keys()).forEach((command) => unregisterHandler(command as IPCCommand));
  console.log('[IPC] All handlers unregistered.');
}

