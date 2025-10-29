# PhotoMan Electron - 快速入门指南

## 概述

本文档帮助开发者快速上手Electron版本PhotoMan的开发工作。

## 前置要求

- **Node.js**: 18.x 或更高 (推荐18.x LTS)
- **pnpm**: 8.x 或更高 (或npm/yarn)
- **Git**: 2.x
- **编译工具**: 
  - Windows: Visual Studio Build Tools或Windows SDK
  - macOS: Xcode Command Line Tools
  - Linux: build-essential, python3

## 项目结构

```
photoman/
├── src/                    # 前端代码(React)
│   ├── api/                # API调用层
│   │   └── tauri-adapter.ts  # Tauri/Electron适配
│   ├── components/         # React组件
│   ├── pages/              # 页面
│   └── stores/             # Zustand状态管理
├── electron/               # Electron主进程代码
│   ├── main.ts             # 主进程入口
│   ├── preload.ts          # Preload脚本
│   ├── services/           # 服务层
│   │   ├── database.ts     # 数据库服务
│   │   ├── scanner.ts      # 文件扫描服务
│   │   ├── thumbnail.ts    # 缩略图服务
│   │   ├── watcher.ts      # 文件监控服务
│   │   └── exif.ts         # EXIF提取服务
│   ├── ipc/                # IPC处理器
│   │   └── handlers.ts     # 命令处理注册
│   └── types/              # 类型定义
│       └── index.ts        # 共享类型
├── dist/                   # 前端构建输出
├── dist-electron/          # Electron构建输出
├── package.json            # 依赖配置
├── tsconfig.json           # TypeScript配置
├── vite.config.ts          # Vite配置
└── electron-builder.json   # 打包配置
```

## 环境搭建

### 1. 克隆项目

```bash
git clone <repo-url>
cd photoman
git checkout 002-electron-backend
```

### 2. 安装依赖

```bash
# 使用pnpm(推荐)
pnpm install

# 或npm
npm install
```

### 3. 重编译native模块

```bash
# better-sqlite3和sharp需要针对Electron重编译
pnpm run rebuild

# 或手动
npx electron-rebuild
```

## 开发工作流

### 启动开发服务器

```bash
# 同时启动Vite和Electron
pnpm run dev

# 或分别启动
pnpm run dev:vite    # 终端1
pnpm run dev:electron # 终端2
```

### 调试

#### 调试渲染进程

打开应用后按`F12`或`Ctrl+Shift+I`打开DevTools

#### 调试主进程

**方法1: VSCode调试**

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Electron Main",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "runtimeArgs": [".", "--remote-debugging-port=9223"],
      "outputCapture": "std"
    }
  ]
}
```

**方法2: Chrome DevTools**

```bash
# 启动时添加inspect参数
pnpm run dev -- --inspect=9229
```

然后在Chrome打开`chrome://inspect`

### 热重载

开发模式下自动支持:
- 前端代码变更: Vite HMR
- 主进程代码变更: electron-reload自动重启

### 日志查看

```bash
# 主进程日志输出到终端
console.log('[Main]', 'message');

# 渲染进程日志输出到DevTools Console
console.log('[Renderer]', 'message');
```

## 核心开发任务

### 添加新的IPC命令

#### 1. 定义类型

`electron/types/index.ts`:
```typescript
export interface GetPhotosParams {
  limit?: number;
  offset?: number;
}

export interface GetPhotosResponse {
  photos: Photo[];
  total: number;
}
```

#### 2. 实现服务方法

`electron/services/database.ts`:
```typescript
export class DatabaseService {
  getPhotos(params: GetPhotosParams): GetPhotosResponse {
    const { limit = 100, offset = 0 } = params;
    const photos = this.db.prepare(`
      SELECT * FROM photos 
      WHERE is_deleted = 0
      ORDER BY taken_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset) as Photo[];
    
    const total = this.db.prepare(`
      SELECT COUNT(*) as count FROM photos WHERE is_deleted = 0
    `).get() as { count: number };
    
    return { photos, total: total.count };
  }
}
```

#### 3. 注册IPC处理器

`electron/ipc/handlers.ts`:
```typescript
import { ipcMain } from 'electron';
import { databaseService } from '../services';

export function registerHandlers() {
  ipcMain.handle('get_photos', async (event, params: GetPhotosParams) => {
    try {
      return databaseService.getPhotos(params);
    } catch (error) {
      console.error('[IPC] get_photos error:', error);
      throw error;
    }
  });
}
```

#### 4. 前端调用

`src/api/photos.ts`:
```typescript
import { invoke } from './tauri-adapter';
import type { Photo, GetPhotosParams } from '../../electron/types';

export async function getPhotos(params?: GetPhotosParams): Promise<Photo[]> {
  const result = await invoke<GetPhotosResponse>('get_photos', params);
  return result.photos;
}
```

### 添加新的服务模块

#### 1. 创建服务类

`electron/services/new-service.ts`:
```typescript
export class NewService {
  private someState: any;
  
  constructor() {
    this.initialize();
  }
  
  private initialize() {
    // 初始化逻辑
  }
  
  public doSomething(param: string): string {
    // 业务逻辑
    return 'result';
  }
}

export const newService = new NewService();
```

#### 2. 导出服务

`electron/services/index.ts`:
```typescript
export { databaseService } from './database';
export { scannerService } from './scanner';
export { newService } from './new-service'; // 新增
```

#### 3. 注册IPC命令

`electron/ipc/handlers.ts`:
```typescript
import { newService } from '../services';

export function registerHandlers() {
  // ...其他处理器
  
  ipcMain.handle('new_command', async (event, param: string) => {
    return newService.doSomething(param);
  });
}
```

### 数据库操作

#### 查询

```typescript
// 简单查询
const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(id);

// 批量查询
const photos = db.prepare('SELECT * FROM photos LIMIT ?').all(100);

// 使用预编译语句
const stmt = db.prepare('SELECT * FROM photos WHERE id = ?');
const photo1 = stmt.get(1);
const photo2 = stmt.get(2);
```

#### 插入

```typescript
const stmt = db.prepare(`
  INSERT INTO photos (file_path, file_name, ...) 
  VALUES (?, ?, ...)
`);
const result = stmt.run(filePath, fileName, ...);
const newId = result.lastInsertRowid;
```

#### 更新

```typescript
db.prepare('UPDATE photos SET title = ? WHERE id = ?').run(title, id);
```

#### 事务

```typescript
const transaction = db.transaction((photos: CreatePhotoInput[]) => {
  const stmt = db.prepare('INSERT INTO photos (...) VALUES (...)');
  for (const photo of photos) {
    stmt.run(photo);
  }
});

// 执行事务(自动rollback on error)
transaction(photos);
```

### 图片处理

#### 生成缩略图

```typescript
import sharp from 'sharp';

async function generateThumbnail(inputPath: string, outputPath: string, size: number) {
  await sharp(inputPath)
    .resize(size, size, {
      fit: 'cover',
      position: 'centre'
    })
    .jpeg({ quality: 85 })
    .toFile(outputPath);
}
```

#### 批量处理

```typescript
async function generateThumbnailsBatch(paths: string[], size: number) {
  const concurrency = 5;
  const results = [];
  
  for (let i = 0; i < paths.length; i += concurrency) {
    const batch = paths.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(path => generateThumbnail(path, getOutputPath(path), size))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

### 文件监控

```typescript
import chokidar from 'chokidar';

const watcher = chokidar.watch('/path/to/dir', {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: true
});

watcher
  .on('add', path => console.log(`File ${path} has been added`))
  .on('change', path => console.log(`File ${path} has been changed`))
  .on('unlink', path => console.log(`File ${path} has been removed`));

// 停止监控
watcher.close();
```

## 测试

### 单元测试

```bash
pnpm run test
```

示例:
```typescript
import { DatabaseService } from '../services/database';

describe('DatabaseService', () => {
  let dbService: DatabaseService;
  
  beforeEach(() => {
    dbService = new DatabaseService(':memory:');
  });
  
  afterEach(() => {
    dbService.close();
  });
  
  it('should get photos', () => {
    const photos = dbService.getPhotos({ limit: 10 });
    expect(photos).toHaveLength(10);
  });
});
```

### 端到端测试

```bash
pnpm run test:e2e
```

## 构建与打包

### 开发构建

```bash
# 构建前端
pnpm run build

# 构建Electron主进程
pnpm run build:electron
```

### 生产打包

```bash
# 打包当前平台
pnpm run dist

# 打包特定平台
pnpm run dist:win    # Windows
pnpm run dist:mac    # macOS
pnpm run dist:linux  # Linux

# 打包所有平台(需要在对应系统上或使用CI)
pnpm run dist:all
```

输出位置: `dist-output/`

### 打包配置

`electron-builder.json`:
```json
{
  "appId": "com.photoman.app",
  "productName": "PhotoMan",
  "directories": {
    "output": "dist-output"
  },
  "files": [
    "dist/**/*",
    "dist-electron/**/*",
    "package.json"
  ],
  "win": {
    "target": ["nsis"],
    "icon": "build/icon.ico"
  },
  "mac": {
    "target": ["dmg"],
    "icon": "build/icon.icns",
    "category": "public.app-category.photography"
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "icon": "build/icon.png",
    "category": "Graphics"
  }
}
```

## 常见问题

### Q1: native模块编译失败

**症状**: `better-sqlite3`或`sharp`安装错误

**解决**:
```bash
# 清理并重装
rm -rf node_modules package-lock.json
npm install

# 重编译
npx electron-rebuild

# 如果还失败,检查编译工具链
# Windows: 安装Visual Studio Build Tools
# macOS: xcode-select --install
# Linux: apt install build-essential
```

### Q2: Electron窗口无法打开DevTools

**症状**: 按F12无响应

**解决**:
```typescript
// main.ts
if (isDev) {
  mainWindow.webContents.openDevTools();
}
```

### Q3: 前端无法调用IPC命令

**症状**: `window.electronAPI is undefined`

**解决**:
1. 检查preload脚本是否正确加载
2. 检查contextBridge是否正确暴露
3. 检查webPreferences配置:
```typescript
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  preload: path.join(__dirname, 'preload.js') // 确保路径正确
}
```

### Q4: 数据库文件找不到

**症状**: `SQLITE_CANTOPEN`

**解决**:
```typescript
import { app } from 'electron';
import path from 'path';

// 使用app.getPath获取正确的用户数据目录
const dbPath = path.join(app.getPath('userData'), 'photoman.db');
```

### Q5: 图片加载失败

**症状**: 图片src无法显示

**解决**:
```typescript
// 注册自定义协议
import { protocol } from 'electron';

app.whenReady().then(() => {
  protocol.registerFileProtocol('photoman', (request, callback) => {
    const url = request.url.replace('photoman://', '');
    callback({ path: decodeURIComponent(url) });
  });
});

// 前端使用
<img src="photoman:///absolute/path/to/image.jpg" />

// 或使用file://协议(需配置CSP)
<img src={`file://${photo.file_path}`} />
```

## 性能优化建议

### 1. 数据库优化

```typescript
// 启用WAL模式
db.pragma('journal_mode = WAL');

// 增加缓存
db.pragma('cache_size = 10000');

// 使用预编译语句
const stmt = db.prepare('...');
for (const item of items) {
  stmt.run(item);
}
```

### 2. 图片处理优化

```typescript
// 限制并发数
const concurrency = navigator.hardwareConcurrency || 4;

// 使用Sharp的缓存
sharp.cache({ memory: 50, files: 20 });

// 渐进式JPEG
sharp(input).jpeg({ progressive: true });
```

### 3. IPC优化

```typescript
// 批量传输
ipcMain.handle('get_photos_batch', async (event, ids) => {
  return ids.map(id => getPhotoById(id));
});

// 使用流式传输大数据
ipcMain.handle('scan_folder', async (event, path) => {
  for await (const photo of scanIterator(path)) {
    event.sender.send('scan_progress', photo);
  }
});
```

## 下一步

- 阅读[开发者指南](./developer-guide.md)了解更多细节
- 查看[数据模型](./data-model.md)了解数据库结构
- 参考[实施计划](./plan.md)了解项目进度

## 资源链接

- [Electron官方文档](https://www.electronjs.org/docs/latest/)
- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/wiki/API)
- [Sharp文档](https://sharp.pixelplumbing.com/)
- [项目宪章](../../.specify/memory/constitution.md)


