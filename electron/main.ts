import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { logger } from './utils/logger';
import { registerHandlers, unregisterAllHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false, // 等待ready-to-show事件
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // 开发模式打开DevTools
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 窗口准备好后显示
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  // 窗口关闭事件
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用就绪时创建窗口
app.whenReady().then(() => {
  // 初始化日志系统
  logger.initialize();
  logger.info('[Main] Application starting...', {
    version: app.getVersion(),
    platform: process.platform,
    isDev,
  });

  // 注册IPC处理器
  registerHandlers();

  // 创建窗口
  createWindow();

  // macOS: 点击dock图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用即将退出
app.on('before-quit', () => {
  logger.info('[Main] Application quitting...');

  // 注销IPC处理器
  unregisterAllHandlers();

  // 关闭日志系统
  logger.close();
});

