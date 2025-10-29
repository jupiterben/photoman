# 功能规划文档

## 基本信息

- **功能名称**: Electron后端迁移
- **优先级**: 中
- **预计工作量**: 15-20天
- **负责人**: 开发团队
- **目标版本**: 2.0.0
- **创建日期**: 2025-10-29

## 功能概述

将PhotoMan应用的后端技术栈从Tauri(Rust)完整迁移到Electron(Node.js),实现技术栈统一。主要动机:

1. **降低开发门槛**: JavaScript/TypeScript比Rust学习曲线更平缓,团队上手更快
2. **统一技术栈**: 前后端都使用JavaScript生态,减少技术切换成本
3. **丰富的生态**: npm生态拥有海量成熟库,开发效率更高
4. **调试便利**: Chrome DevTools对Node.js调试支持完善

迁移后保持所有功能特性和用户体验不变,数据库完全兼容无需迁移。

## 宪章合规检查

在开始实现前，确认本功能符合项目宪章的以下原则：

- [x] **隐私至上**: ✅ 保持所有数据本地存储,Electron同样不涉及远程传输
- [x] **性能优先**: ⚠️ Electron内存占用会增加(~150MB基础),但通过better-sqlite3同步API、Sharp优化可保持可接受性能
- [x] **用户体验至上**: ✅ 用户界面和操作完全不变,升级无感知
- [x] **数据完整性**: ✅ SQLite数据库格式完全兼容,无需数据迁移,保持软删除机制
- [x] **可扩展性**: ✅ 采用模块化设计,服务层清晰分离(Database/Scanner/Thumbnail等)
- [x] **跨平台兼容**: ✅ Electron天然支持Windows/macOS/Linux,使用path模块处理路径差异
- [x] **关注点分离**: ✅ 主进程和渲染进程分离,通过preload安全暴露API,各服务模块职责单一

### 潜在风险与缓解

**性能下降风险**: Electron内存占用高于Tauri
- **缓解**: 使用native模块(better-sqlite3),优化关键路径,合理缓存

**安装包体积风险**: Electron安装包>150MB vs Tauri<10MB  
- **缓解**: 用户可选择保留Tauri版本,或接受体积增加换取开发便利性

## 用户故事

### US1: 无感知升级

作为 **PhotoMan用户**，我希望应用升级后所有功能和数据保持不变，以便无需重新学习或迁移数据。

**验收标准**:
- [ ] 升级后应用界面、操作、快捷键完全一致
- [ ] 已有图片库、标签、相册自动识别,无需迁移
- [ ] 所有功能正常工作(扫描、浏览、标签、搜索、回收站)
- [ ] 性能不明显下降(启动<3秒,搜索<200ms)

### US2: 开发便利性

作为 **开发者**，我希望使用JavaScript/TypeScript开发后端，以便降低学习成本和提高开发效率。

**验收标准**:
- [ ] 后端代码全部使用TypeScript编写
- [ ] 可使用npm生态的成熟库(better-sqlite3、Sharp等)
- [ ] 使用Chrome DevTools调试主进程和渲染进程
- [ ] 代码结构清晰,模块化设计

## 技术方案

### 架构设计

采用Electron典型的双进程架构:

```
┌────────────────────────────────────────┐
│      渲染进程 (Renderer Process)        │
│   React + TypeScript (保持不变)         │
│   - UI组件                              │
│   - 状态管理(Zustand)                   │
│   - API调用(通过contextBridge)          │
└──────────────┬─────────────────────────┘
               │ IPC通信 (安全隔离)
               │ contextBridge + preload.js
┌──────────────┴─────────────────────────┐
│      主进程 (Main Process)              │
│   Node.js + TypeScript                 │
│   ├─ 窗口管理 (BrowserWindow)           │
│   ├─ IPC处理器 (ipcMain)                │
│   ├─ DatabaseService                   │
│   ├─ ScannerService                    │
│   ├─ ThumbnailService                  │
│   ├─ WatcherService                    │
│   └─ ExifService                       │
└──────────────┬─────────────────────────┘
               │
┌──────────────┴─────────────────────────┐
│      文件系统 & 数据库                  │
│   - SQLite数据库 (schema不变)           │
│   - 图片文件 (file://)                  │
│   - 缩略图缓存                          │
└────────────────────────────────────────┘
```

**核心特点**:
- **安全隔离**: 渲染进程禁用Node.js集成,通过preload脚本安全暴露API
- **模块化**: 服务层按职责划分,便于测试和维护
- **数据兼容**: SQLite schema完全保持,直接读取Tauri版本数据

### 关键技术点

#### 1. **IPC通信机制**

**Tauri方式**:
```typescript
// 前端
import { invoke } from '@tauri-apps/api/core';
const photos = await invoke<Photo[]>('get_photos', { limit, offset });
```

**Electron方式**:
```typescript
// preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (command: string, args?: any) => ipcRenderer.invoke(command, args)
});

// main.ts
ipcMain.handle('get_photos', async (event, { limit, offset }) => {
  return databaseService.getPhotos(limit, offset);
});

// 前端 (通过适配层保持API不变)
const photos = await invoke<Photo[]>('get_photos', { limit, offset });
```

#### 2. **数据库访问**

**选择better-sqlite3而非node-sqlite3的原因**:
- **同步API**: 避免async/await开销,性能更好
- **TypeScript支持**: 类型定义完善
- **简单直接**: 代码更简洁

```typescript
import Database from 'better-sqlite3';

class DatabaseService {
  private db: Database.Database;
  
  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // 性能优化
  }
  
  getPhotos(limit?: number, offset?: number): Photo[] {
    const stmt = this.db.prepare(`
      SELECT * FROM photos 
      WHERE is_deleted = 0 
      ORDER BY taken_at DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit || 100, offset || 0) as Photo[];
  }
}
```

#### 3. **图片处理**

使用Sharp库替代Rust的image crate:

```typescript
import sharp from 'sharp';

class ThumbnailService {
  async generateThumbnail(photoPath: string, size: number): Promise<Buffer> {
    return await sharp(photoPath)
      .resize(size, size, { 
        fit: 'cover',
        position: 'centre'
      })
      .jpeg({ quality: 85 })
      .toBuffer();
  }
  
  async generateBatch(paths: string[], size: number): Promise<Map<string, Buffer>> {
    const results = new Map();
    // 使用Promise.all并行处理,但限制并发数避免内存爆炸
    const concurrency = 5;
    for (let i = 0; i < paths.length; i += concurrency) {
      const batch = paths.slice(i, i + concurrency);
      const buffers = await Promise.all(
        batch.map(path => this.generateThumbnail(path, size))
      );
      batch.forEach((path, idx) => results.set(path, buffers[idx]));
    }
    return results;
  }
}
```

#### 4. **文件扫描**

使用Node.js内置fs模块 + crypto:

```typescript
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

class ScannerService {
  async scanFolder(folderPath: string, onProgress: (progress: number) => void): Promise<ScanResult> {
    const files = await this.walkDirectory(folderPath);
    const imageFiles = files.filter(f => this.isImageFile(f));
    
    let processed = 0;
    for (const file of imageFiles) {
      const hash = await this.calculateHash(file);
      // 检查重复...
      // 提取EXIF...
      // 插入数据库...
      processed++;
      onProgress(processed / imageFiles.length);
    }
    
    return { totalFiles: files.length, foundPhotos: imageFiles.length };
  }
  
  private async calculateHash(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
  
  private async walkDirectory(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map(entry => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? this.walkDirectory(fullPath) : fullPath;
    }));
    return files.flat();
  }
}
```

#### 5. **文件监控**

使用chokidar替代Rust的notify:

```typescript
import chokidar from 'chokidar';

class WatcherService {
  private watchers = new Map<string, chokidar.FSWatcher>();
  
  watchDirectory(dirPath: string) {
    const watcher = chokidar.watch(dirPath, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true,
      ignoreInitial: true
    });
    
    watcher
      .on('add', path => this.handleNewFile(path))
      .on('unlink', path => this.handleDeletedFile(path));
    
    this.watchers.set(dirPath, watcher);
  }
  
  private async handleNewFile(filePath: string) {
    if (this.isImageFile(filePath)) {
      // 自动入库...
    }
  }
}
```

#### 6. **EXIF提取**

使用exifr库:

```typescript
import exifr from 'exifr';

class ExifService {
  async extractExif(photoPath: string): Promise<ExifData> {
    try {
      const exif = await exifr.parse(photoPath, {
        tiff: true,
        exif: true,
        gps: true
      });
      
      return {
        takenAt: exif?.DateTimeOriginal,
        cameraMake: exif?.Make,
        cameraModel: exif?.Model,
        lensModel: exif?.LensModel,
        focalLength: exif?.FocalLength,
        aperture: exif?.FNumber,
        shutterSpeed: exif?.ExposureTime,
        iso: exif?.ISO,
        gpsLatitude: exif?.latitude,
        gpsLongitude: exif?.longitude,
        gpsAltitude: exif?.GPSAltitude
      };
    } catch (error) {
      console.warn(`Failed to extract EXIF from ${photoPath}:`, error);
      return {};
    }
  }
}
```

### 数据模型

数据库schema **完全保持不变**,参考[data-model.md](./data-model.md)。

关键点:
- 9张表: photos, tags, albums, photo_tags, album_photos, scan_jobs, thumbnail_cache, settings, smart_albums
- 索引策略不变
- 外键约束保持
- 软删除机制保持

**TypeScript类型定义保持不变**:
```typescript
interface Photo {
  id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  // ...其他字段与Rust版本完全一致
}
```

## 依赖项

- **前置条件**: 
  - 无(可在独立分支开发,与Tauri版本并行)
  - 建议用户备份现有数据库(虽然schema兼容,但安全第一)

- **技术依赖**:
  - **Electron**: ^28.0.0 (最新稳定版)
  - **better-sqlite3**: ^9.0.0 (SQLite访问)
  - **sharp**: ^0.33.0 (图片处理)
  - **chokidar**: ^3.5.0 (文件监控)
  - **exifr**: ^7.0.0 (EXIF提取)
  - **electron-builder**: ^24.0.0 (打包工具)
  - **concurrently**: ^8.0.0 (开发时并行运行)

- **外部依赖**: 
  - Node.js 18.x+ (LTS)
  - 系统依赖: 无额外要求(Electron自包含)

## 风险评估

| 风险 | 影响程度 | 可能性 | 缓解措施 |
|------|---------|--------|----------|
| **性能下降** - Electron内存占用高,可能影响用户体验 | 中 | 高 | 1. 使用better-sqlite3同步API提升性能<br>2. Sharp并行处理限制并发数<br>3. 性能测试对比,确保不低于Tauri 80% |
| **安装包体积** - 从<10MB增至>150MB | 低 | 高 | 1. 说明文档告知用户<br>2. 提供Tauri和Electron两个版本选择<br>3. 使用asar压缩减小体积 |
| **数据库兼容性** - SQLite格式差异导致数据损坏 | 高 | 低 | 1. 充分测试数据迁移<br>2. 建议用户备份<br>3. 启动时验证数据库完整性 |
| **native模块编译** - better-sqlite3/sharp需要编译,CI/CD复杂 | 中 | 中 | 1. 使用electron-rebuild自动重编译<br>2. CI配置各平台编译环境<br>3. 提供prebuild二进制 |
| **IPC安全** - 暴露过多API到渲染进程 | 中 | 低 | 1. 启用contextIsolation<br>2. 仅暴露必要的API<br>3. 参数验证和权限检查 |
| **用户抗拒** - 部分用户不愿升级 | 低 | 中 | 1. 充分沟通迁移原因和好处<br>2. 同时维护两个版本一段时间<br>3. 提供平滑升级路径 |

## 测试策略

### 单元测试
- [ ] **DatabaseService测试**
  - CRUD操作正确性
  - 事务处理
  - 错误处理
- [ ] **ScannerService测试**
  - 文件遍历逻辑
  - 哈希计算
  - 重复检测
- [ ] **ThumbnailService测试**
  - 缩略图生成质量
  - 批量处理
  - 缓存管理

### 集成测试
- [ ] **端到端流程**
  - 扫描文件夹 → 入库 → 显示列表
  - 添加标签 → 搜索 → 筛选
  - 删除到回收站 → 恢复
- [ ] **IPC通信**
  - 所有命令正确转发
  - 错误正确传递到前端
  - 类型安全性

### 性能测试
- [ ] **启动时间**: 空库 vs 10000张图片
- [ ] **扫描性能**: 1000张图片耗时
- [ ] **滚动性能**: 10000张网格60fps
- [ ] **搜索响应**: <200ms
- [ ] **内存占用**: 空闲<150MB, 负载<800MB

### 兼容性测试
- [ ] **跨平台验证**
  - Windows 10/11
  - macOS 12/13/14
  - Ubuntu 22.04/24.04
- [ ] **数据兼容性**
  - Tauri数据库 → Electron正常读取
  - Electron数据库 → Tauri正常读取(可选)
- [ ] **路径处理**
  - Windows反斜杠路径
  - Unix正斜杠路径
  - 特殊字符文件名

### 回归测试
- [ ] 所有Tauri版本功能清单验证
- [ ] 快捷键工作正常
- [ ] 设置保持一致

## 实施阶段

### 阶段0: 环境搭建与研究 (2天)

**任务**:
- [x] 技术选型研究(Electron vs 其他方案)
- [ ] 搭建Electron项目骨架
- [ ] 配置TypeScript、ESLint、prettier
- [ ] 配置electron-builder打包
- [ ] 验证native模块(better-sqlite3、sharp)在各平台编译

**交付物**: 可运行的空Electron应用

### 阶段1: 核心基础设施 (3天)

**任务**:
- [ ] 实现主进程入口(main.ts)
- [ ] 实现preload脚本(安全的IPC桥梁)
- [ ] 实现IPC命令注册机制
- [ ] 创建服务层基础架构(BaseService)
- [ ] 实现错误处理和日志记录

**交付物**: IPC通信机制完成,可从渲染进程调用主进程

### 阶段2: 数据库层 (3天)

**任务**:
- [ ] 实现DatabaseService
- [ ] 迁移所有表的CRUD操作(photos, tags, albums等)
- [ ] 实现事务支持
- [ ] 实现FTS5全文搜索
- [ ] 数据库初始化和迁移逻辑
- [ ] 单元测试

**交付物**: 数据库层完成,通过单元测试

### 阶段3: 文件扫描与处理 (4天)

**任务**:
- [ ] 实现ScannerService(文件遍历、哈希计算、去重)
- [ ] 实现ExifService(EXIF提取)
- [ ] 实现ThumbnailService(Sharp缩略图生成)
- [ ] 实现批量处理和进度报告
- [ ] 集成测试(扫描1000张图片)

**交付物**: 扫描功能完成,性能可接受

### 阶段4: 文件监控与搜索 (2天)

**任务**:
- [ ] 实现WatcherService(chokidar监控)
- [ ] 实现SearchService(复杂查询构建)
- [ ] 集成现有FTS5搜索
- [ ] 监控自动入库测试

**交付物**: 监控和搜索功能完成

### 阶段5: 前端适配层 (2天)

**任务**:
- [ ] 创建tauri-adapter.ts(兼容层)
- [ ] 更新前端API调用(从Tauri invoke改为适配层)
- [ ] 测试所有前端功能
- [ ] 修复类型定义差异

**交付物**: 前端完全适配,功能正常

### 阶段6: 跨平台测试与优化 (3天)

**任务**:
- [ ] Windows平台完整测试
- [ ] macOS平台完整测试
- [ ] Linux平台完整测试
- [ ] 性能优化(内存、启动时间、响应速度)
- [ ] 修复平台特定bug

**交付物**: 三平台全功能可用

### 阶段7: 打包与发布 (1天)

**任务**:
- [ ] 配置electron-builder(NSIS、DMG、AppImage)
- [ ] 生成各平台安装包
- [ ] 安装测试
- [ ] 升级测试(Tauri → Electron)
- [ ] 发布说明文档

**交付物**: 可发布的安装包

## 文档要求

- [ ] **迁移指南** (migration-guide.md)
  - Tauri → Electron变更说明
  - 开发者迁移步骤
  - API差异对照表
  
- [ ] **开发者指南** (developer-guide.md)
  - Electron项目结构
  - 主进程服务层说明
  - IPC命令添加方法
  - 调试技巧
  
- [ ] **用户升级说明** (upgrade-notes.md)
  - 数据兼容性说明
  - 备份建议
  - 降级方法(如需要)
  
- [ ] **变更日志** (CHANGELOG.md)
  - v2.0.0 主要变更
  - 性能对比数据
  - 已知问题

- [ ] **README更新**
  - 更新技术栈说明(Tauri → Electron)
  - 更新安装和构建说明
  - 更新系统要求

## 参考资料

### 官方文档
- [Electron官方文档](https://www.electronjs.org/docs/latest/)
- [Electron安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/security)
- [better-sqlite3文档](https://github.com/WiseLibs/better-sqlite3/wiki/API)
- [Sharp文档](https://sharp.pixelplumbing.com/)
- [chokidar文档](https://github.com/paulmillr/chokidar)
- [exifr文档](https://github.com/MikeKovarik/exifr)
- [electron-builder文档](https://www.electron.build/)

### 内部文档
- [项目宪章](../../.specify/memory/constitution.md)
- [功能规格](./spec.md)
- [数据模型](./data-model.md)
- [Tauri版本实现总结](../1-photo-manager/)

### 技术参考
- [Electron性能优化实践](https://www.electronjs.org/docs/latest/tutorial/performance)
- [Node.js SQLite最佳实践](https://github.com/WiseLibs/better-sqlite3/wiki/Performance)
- [Sharp性能调优](https://sharp.pixelplumbing.com/performance)
- [IPC通信模式](https://www.electronjs.org/docs/latest/tutorial/ipc)
