# 技术规格说明书 - Electron后端迁移

## 文档信息

- **功能模块**: 后端技术栈迁移
- **版本**: 1.0.0
- **作者**: AI Assistant
- **日期**: 2025-10-29
- **状态**: 草稿

## 概述

### 目标

将PhotoMan应用的后端技术栈从Tauri(Rust)迁移到Electron(Node.js),同时保持前端React代码和核心功能不变。

### 背景

当前PhotoMan使用Tauri框架,前端React+TypeScript,后端Rust。本次迁移将后端改为Electron的Node.js实现,主要目的是:
- 统一技术栈到JavaScript/TypeScript生态
- 降低开发和维护成本
- 利用Node.js生态的丰富库资源
- 便于团队成员快速上手

### 范围

**包含内容**:
- 后端从Rust迁移到Node.js(Electron主进程)
- 数据库访问从rusqlite迁移到better-sqlite3或类似库
- 图片处理从image crate迁移到Sharp
- IPC通信从Tauri invoke改为Electron ipcMain/ipcRenderer
- 文件系统监控从notify迁移到chokidar
- EXIF处理从kamadak-exif迁移到exifr或exif-parser
- 保持数据库schema和数据兼容(SQLite格式不变)
- 保持前端API接口签名不变(Photo、Tag等类型定义)

**不包含内容**:
- 前端组件和UI的修改
- 新增功能特性
- 数据库schema变更
- 用户数据迁移(SQLite文件格式兼容,无需迁移)
- 性能优化(保持现有性能水平即可)

## 用户场景与测试

### 用户视角

**作为普通用户**:
- 升级后应用外观、功能、操作方式完全一致
- 已有的图片数据、标签、相册无需任何迁移操作
- 应用启动时间、响应速度不应明显变慢
- 所有快捷键、设置保持不变

**作为开发者**:
- 可以使用Node.js/TypeScript编写后端逻辑
- 可以利用npm生态的丰富库
- 调试更方便(Chrome DevTools)
- 新成员上手更快(无需学习Rust)

### 测试场景

#### 场景1: 基本功能验证
1. 启动应用
2. 扫描已有图片库
3. 浏览缩略图网格
4. 打开图片详情
5. 添加/删除标签
6. 搜索图片
7. 删除图片到回收站
8. **预期**: 所有操作正常,响应及时

#### 场景2: 数据兼容性
1. 使用Tauri版本创建图片库
2. 关闭应用
3. 启动Electron版本
4. **预期**: 所有图片、标签、相册正常显示,数据完整

#### 场景3: 性能对比
1. 加载10000张图片的图库
2. 记录启动时间、滚动帧率、搜索响应
3. **预期**: 性能指标不低于现有Tauri版本的80%

#### 场景4: 跨平台验证
1. 在Windows、macOS、Linux上分别测试
2. **预期**: 所有平台功能正常

## 功能需求

### FR1: Electron主进程搭建

**描述**: 创建Electron主进程,替代Tauri的Rust后端

**优先级**: 必须

**验收标准**:
- 创建主进程入口文件(main.js或main.ts)
- 配置窗口创建(尺寸、最小尺寸、图标等与Tauri一致)
- 配置开发/生产环境差异处理
- 支持热重载(开发模式)
- 生成可执行文件(Windows/macOS/Linux)

### FR2: IPC通信机制

**描述**: 实现前后端通信,替代Tauri的invoke机制

**优先级**: 必须

**验收标准**:
- 创建preload脚本,暴露安全的API到渲染进程
- 实现双向IPC(ipcMain/ipcRenderer)
- 支持异步命令(对应Tauri的invoke)
- 错误统一处理和传递
- TypeScript类型定义完整

### FR3: 数据库层迁移

**描述**: 将SQLite操作从rusqlite迁移到Node.js库

**优先级**: 必须

**验收标准**:
- 选择合适的SQLite库(better-sqlite3推荐,因为同步API性能好)
- 迁移所有数据库初始化代码
- 迁移所有表的CRUD操作
- 保持数据库schema完全一致
- 支持事务处理
- 支持FTS5全文搜索

### FR4: 图片处理迁移

**描述**: 将图片处理从image crate迁移到Node.js库

**优先级**: 必须

**验收标准**:
- 使用Sharp库处理图片缩放、裁剪
- 支持JPEG、PNG、WebP、GIF等格式
- 缩略图生成质量不低于Rust版本
- 批量处理性能可接受(可能略慢于Rust,但应在200ms/张以内)

### FR5: 文件扫描迁移

**描述**: 将目录扫描、文件遍历从Rust迁移到Node.js

**优先级**: 必须

**验收标准**:
- 递归扫描指定目录
- 识别图片文件(根据扩展名和MIME类型)
- 计算文件哈希(SHA-256,用于去重)
- 提取EXIF信息
- 进度报告机制
- 支持取消扫描

### FR6: 文件系统监控迁移

**描述**: 将文件变化监控从notify迁移到chokidar

**优先级**: 必须

**验收标准**:
- 监控指定目录的文件增删改
- 新增图片自动入库
- 删除图片自动标记
- 避免频繁触发(防抖处理)

### FR7: EXIF处理迁移

**描述**: 将EXIF元数据提取从Rust迁移到Node.js

**优先级**: 必须

**验收标准**:
- 提取拍摄时间、相机型号、GPS等信息
- 支持常见图片格式(JPEG、TIFF)
- 处理异常数据(损坏或不规范的EXIF)

### FR8: API接口保持

**描述**: 前端调用的所有API接口签名保持不变

**优先级**: 必须

**验收标准**:
- Photo、Tag、Album等TypeScript类型定义不变
- API函数名称不变(getPhotos、createTag等)
- 参数和返回值类型不变
- 错误处理方式一致

## 非功能需求

### NFR1: 性能需求

**启动时间**:
- 冷启动: < 3秒(允许比Tauri的<1秒略慢)
- 热启动: < 1秒

**响应时间**:
- 图片列表加载: < 500ms(1000张)
- 缩略图生成: < 200ms/张
- 搜索响应: < 200ms
- 标签操作: < 100ms

**吞吐量**:
- 支持图库大小: 10000+张
- 批量扫描速度: > 10张/秒

**内存占用**:
- 空闲: < 150MB(Electron基础内存开销)
- 浏览10000张: < 800MB

### NFR2: 兼容性需求

**操作系统**:
- Windows 10+
- macOS 11+
- Linux(Ubuntu 20.04+, Fedora 35+)

**Node.js版本**:
- 18.x 或更高(LTS)

**数据兼容性**:
- 与Tauri版本共享相同的SQLite数据库文件
- 不破坏现有用户数据

### NFR3: 安全性需求

- 渲染进程禁用Node.js集成(nodeIntegration: false)
- 启用上下文隔离(contextIsolation: true)
- 通过preload脚本安全暴露API
- 敏感操作(删除、扫描)需用户确认

### NFR4: 可维护性需求

- 使用TypeScript编写主进程代码
- 模块化架构,分离关注点
- 完善的错误日志记录
- 代码风格与前端一致

## 技术设计

### 架构概览

```
┌─────────────────────────────────────┐
│      Renderer Process               │
│   (React + TypeScript - 不变)       │
└──────────────┬──────────────────────┘
               │ IPC (通过preload)
┌──────────────┴──────────────────────┐
│      Main Process (Node.js)         │
│  ├─ Window Management               │
│  ├─ IPC Handlers                    │
│  ├─ Database Service                │
│  ├─ Scanner Service                 │
│  ├─ Thumbnail Service               │
│  ├─ Watcher Service                 │
│  └─ EXIF Service                    │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      File System & Database         │
│   (SQLite + 图片文件)                │
└─────────────────────────────────────┘
```

**技术栈**:
- 桌面框架: Electron (最新稳定版,建议28.x+)
- 后端语言: Node.js 18+ / TypeScript 5
- 前端框架: React 18 + TypeScript 5 (保持不变)
- 数据库: better-sqlite3
- 图片处理: Sharp
- 文件监控: chokidar
- EXIF处理: exifr
- 哈希计算: crypto (Node.js内置)

### 模块设计

#### 模块1: 主进程入口(main.ts)

**职责**: 
- 创建和管理应用窗口
- 注册IPC处理器
- 生命周期管理

**关键代码**:
```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import { registerHandlers } from './ipc';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile('dist/index.html');
  }
}

app.whenReady().then(() => {
  registerHandlers(ipcMain);
  createWindow();
});
```

#### 模块2: Preload脚本(preload.ts)

**职责**: 
- 安全地暴露API到渲染进程
- 类型定义与前端一致

**接口**:
```typescript
// 替代Tauri的invoke
interface ElectronAPI {
  invoke<T>(command: string, args?: any): Promise<T>;
}

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (command: string, args?: any) => {
    return ipcRenderer.invoke(command, args);
  }
});
```

#### 模块3: 数据库服务(services/database.ts)

**职责**: 
- SQLite数据库连接管理
- 表的CRUD操作
- 事务处理

**接口**:
```typescript
interface DatabaseService {
  initialize(dbPath: string): void;
  getPhotos(limit?: number, offset?: number): Photo[];
  getPhotoById(id: number): Photo | null;
  updatePhoto(request: UpdatePhotoRequest): void;
  deletePhoto(id: number): void;
  createTag(name: string, color?: string): Tag;
  // ...其他操作
}
```

**依赖**: better-sqlite3

#### 模块4: 扫描服务(services/scanner.ts)

**职责**: 
- 目录遍历
- 图片识别
- 哈希计算
- 去重检测

**接口**:
```typescript
interface ScannerService {
  scanFolder(folderPath: string, onProgress: (progress: number) => void): Promise<ScanResult>;
  cancelScan(): void;
}
```

**依赖**: fs/promises, crypto, path

#### 模块5: 缩略图服务(services/thumbnail.ts)

**职责**: 
- 缩略图生成
- 缓存管理

**接口**:
```typescript
interface ThumbnailService {
  generateThumbnail(photoPath: string, size: number): Promise<Buffer>;
  generateThumbnailsBatch(photoPaths: string[], size: number): Promise<Map<string, Buffer>>;
  cleanupCache(): void;
}
```

**依赖**: Sharp

#### 模块6: 监控服务(services/watcher.ts)

**职责**: 
- 文件系统变化监控
- 自动入库新图片

**接口**:
```typescript
interface WatcherService {
  watchDirectory(dirPath: string): void;
  unwatchDirectory(dirPath: string): void;
  stopAll(): void;
}
```

**依赖**: chokidar

#### 模块7: EXIF服务(services/exif.ts)

**职责**: 
- 提取EXIF元数据

**接口**:
```typescript
interface ExifService {
  extractExif(photoPath: string): Promise<ExifData>;
}
```

**依赖**: exifr

### 数据模型

数据库schema保持与Tauri版本完全一致,包括:

- photos表: 图片基本信息
- tags表: 标签信息
- albums表: 相册信息
- photo_tags表: 图片-标签关联
- album_photos表: 相册-图片关联
- scan_jobs表: 扫描任务记录
- thumbnail_cache表: 缩略图缓存
- settings表: 应用设置
- smart_albums表: 智能相册规则
- FTS5虚拟表: 全文搜索

TypeScript类型定义保持不变:
```typescript
interface Photo {
  id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  width?: number;
  height?: number;
  format: string;
  title?: string;
  description?: string;
  rating: number;
  taken_at?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

interface Tag {
  id: number;
  name: string;
  color?: string;
  created_at: string;
}

// ...其他类型
```

### 数据流

**图片扫描流程**:
1. 用户点击"扫描文件夹"
2. 渲染进程调用electronAPI.invoke('scan_folder', { path })
3. 主进程ScannerService遍历目录
4. 对每个图片文件:
   - 计算哈希(去重)
   - 提取EXIF
   - 插入数据库
   - 生成缩略图
   - 报告进度
5. 完成后返回结果

**图片浏览流程**:
1. 渲染进程调用electronAPI.invoke('get_photos', { limit, offset })
2. 主进程DatabaseService查询数据库
3. 返回Photo数组
4. 渲染进程显示缩略图网格
5. 缩略图通过file://协议或base64加载

## 错误处理

### 错误类型

| 错误码 | 描述 | 处理方式 |
|--------|------|----------|
| DB_001 | 数据库连接失败 | 提示用户,尝试重启应用 |
| DB_002 | SQL执行错误 | 记录日志,回滚事务 |
| FS_001 | 文件不存在 | 标记为失效,从列表移除 |
| FS_002 | 权限不足 | 提示用户检查权限 |
| IMG_001 | 图片格式不支持 | 跳过该文件,记录日志 |
| IMG_002 | 缩略图生成失败 | 使用默认图标 |

### 异常情况

- **磁盘空间不足**: 扫描前检查,提示用户
- **数据库锁定**: 重试机制(最多3次)
- **Sharp加载失败**: 降级到其他库或跳过
- **Electron崩溃**: 主进程异常恢复,保存状态

## 迁移策略

### 前端API适配

创建适配层,使前端代码无需修改:

**src/api/tauri-adapter.ts** (新增):
```typescript
// 原本使用Tauri的invoke
import { invoke } from '@tauri-apps/api/core';

// 改为:
declare global {
  interface Window {
    electronAPI: {
      invoke<T>(command: string, args?: any): Promise<T>;
    }
  }
}

export async function invoke<T>(command: string, args?: any): Promise<T> {
  if (window.electronAPI) {
    // Electron环境
    return window.electronAPI.invoke<T>(command, args);
  } else {
    // Tauri环境(向后兼容)
    const tauriInvoke = (await import('@tauri-apps/api/core')).invoke;
    return tauriInvoke<T>(command, args);
  }
}
```

前端代码保持不变:
```typescript
import { invoke } from './tauri-adapter'; // 只需改导入路径

export async function getPhotos(limit?: number, offset?: number): Promise<Photo[]> {
  return await invoke<Photo[]>('get_photos', { limit, offset });
}
```

### 数据兼容性

- SQLite数据库文件格式完全兼容
- 数据库schema不变
- 用户无需任何迁移操作
- 建议首次启动前备份数据

### 构建配置

使用electron-builder替代Tauri的构建系统:

**package.json**:
```json
{
  "main": "electron/main.js",
  "scripts": {
    "dev": "concurrently \"vite\" \"electron .\"",
    "build": "vite build && electron-builder"
  },
  "build": {
    "appId": "com.photoman.app",
    "productName": "PhotoMan",
    "files": ["electron/**/*", "dist/**/*"],
    "win": { "target": "nsis" },
    "mac": { "target": "dmg" },
    "linux": { "target": ["AppImage", "deb"] }
  }
}
```

## 测试计划

### 功能测试

- [ ] 应用启动和窗口创建
- [ ] 图片扫描和导入
- [ ] 图片浏览(列表、网格、详情)
- [ ] 标签CRUD操作
- [ ] 搜索和过滤
- [ ] 回收站功能
- [ ] 文件监控
- [ ] 缩略图生成

### 兼容性测试

- [ ] Windows 10/11
- [ ] macOS 12/13/14
- [ ] Ubuntu 22.04/24.04
- [ ] 数据库文件在Tauri和Electron版本间互操作

### 性能测试

- [ ] 启动时间(空库 vs 10000张)
- [ ] 扫描性能(1000张图片)
- [ ] 滚动流畅度(10000张网格)
- [ ] 搜索响应时间
- [ ] 内存占用(空闲 vs 负载)

### 回归测试

- [ ] 所有原有功能正常
- [ ] 无数据丢失
- [ ] 快捷键正常
- [ ] 设置保持

## 部署说明

### 构建步骤

1. 安装依赖: `pnpm install`
2. 构建前端: `pnpm run build`
3. 构建Electron: `pnpm run build:electron`
4. 打包: `pnpm run dist`

### 发布产物

- **Windows**: PhotoMan-Setup-x.x.x.exe (NSIS安装包)
- **macOS**: PhotoMan-x.x.x.dmg (磁盘镜像)
- **Linux**: PhotoMan-x.x.x.AppImage, photoman_x.x.x_amd64.deb

### 升级策略

- 使用electron-updater实现自动更新
- 检测新版本
- 后台下载
- 提示用户重启

## 成功标准

1. **功能完整性**: 所有Tauri版本功能在Electron版本正常工作
2. **数据兼容性**: Tauri版本数据库可直接被Electron版本读取
3. **性能可接受**: 关键操作响应时间不超过Tauri版本的1.5倍
4. **跨平台**: Windows/macOS/Linux三平台均可正常运行
5. **安装包大小**: < 150MB(包含Electron运行时)
6. **用户无感知**: 升级后用户体验一致,无需重新学习

## 假设与依赖

### 假设

- Node.js 18+的性能足以满足需求
- Sharp的图片处理质量和速度可接受
- better-sqlite3的性能满足10000+图片规模
- Electron的内存占用增加可以接受

### 依赖

- Electron稳定版(28.x+)
- 现有SQLite数据库无损坏
- 图片文件格式在Sharp支持范围内
- 用户系统满足Electron运行要求

### 风险

**风险1**: Electron性能不及Tauri
- **缓解**: 
  - 优化关键路径(数据库查询、缩略图生成)
  - 使用native模块(better-sqlite3同步API)
  - 合理的缓存策略

**风险2**: 安装包体积过大
- **缓解**:
  - 使用asar打包
  - 排除不必要的依赖
  - 压缩资源文件

**风险3**: 用户抗拒升级
- **缓解**:
  - 同时维护Tauri和Electron两个版本
  - 充分测试后再推送
  - 提供降级方案

## 附录

### 术语表

| 术语 | 定义 |
|------|------|
| Tauri | 使用Rust后端的轻量级桌面应用框架 |
| Electron | 使用Node.js后端的跨平台桌面应用框架 |
| IPC | 进程间通信(Inter-Process Communication) |
| 主进程 | Electron的Node.js进程,负责后端逻辑 |
| 渲染进程 | Electron的Chromium进程,运行前端代码 |
| Preload | 在渲染进程加载前执行的脚本,用于安全暴露API |

### 参考文档

- [Electron官方文档](https://www.electronjs.org/docs)
- [better-sqlite3文档](https://github.com/WiseLibs/better-sqlite3)
- [Sharp文档](https://sharp.pixelplumbing.com/)
- [chokidar文档](https://github.com/paulmillr/chokidar)
- [PhotoMan现有架构文档](../1-photo-manager/spec.md)
