# Electron后端迁移 - 任务清单

## 项目信息

- **功能名称**: Electron后端迁移
- **版本**: 2.0.0
- **创建日期**: 2025-10-29
- **预计工作量**: 15-20天
- **状态**: 待开始

## 任务概览

本任务清单将PhotoMan应用从Tauri(Rust)后端完整迁移到Electron(Node.js)后端，保持所有功能和用户体验不变。

## 实施策略

**MVP优先**: Phase 1-3完成后即可进行基本功能验证
**增量交付**: 每个Phase完成后都有可测试的增量
**并行机会**: 标记[P]的任务可在同一Phase内并行执行

---

## Phase 1: 环境搭建与项目初始化

**目标**: 搭建Electron项目骨架，配置开发环境

**验收标准**:

- [ ] 可运行的空Electron应用窗口
- [ ] TypeScript编译正常
- [ ] native模块(better-sqlite3/sharp)在本地平台编译成功
- [ ] 开发热重载工作正常

### 任务清单

- [x] T001 [P] 安装Electron核心依赖包（electron@^28.0.0）到package.json
- [x] T002 [P] 安装TypeScript开发依赖（typescript@^5.0.0, @types/node）到package.json
- [x] T003 [P] 安装构建工具依赖（electron-builder@^24.0.0, concurrently@^8.0.0）到package.json
- [x] T004 创建Electron主进程目录结构 electron/main.ts, electron/preload.ts, electron/services/, electron/ipc/, electron/types/
- [x] T005 配置TypeScript编译配置 tsconfig.json 和 electron/tsconfig.json（target: ES2020, module: commonjs）
- [x] T006 配置ESLint和Prettier规则文件 .eslintrc.json, .prettierrc
- [x] T007 创建Electron主进程入口文件 electron/main.ts（创建窗口、加载index.html）
- [x] T008 创建Preload脚本 electron/preload.ts（配置contextBridge和安全IPC桥梁）
- [x] T009 配置electron-builder打包配置 electron-builder.json（appId, 输出目录, 平台目标）
- [x] T010 更新package.json脚本（dev, build, build:electron, dist）
- [x] T011 [P] 安装并验证better-sqlite3编译（npm install better-sqlite3@^9.0.0 && npx @electron/rebuild）
- [x] T012 [P] 安装并验证sharp编译（npm install sharp@^0.33.0 && npx @electron/rebuild）
- [x] T013 配置Vite支持Electron开发模式 vite.config.ts（base路径处理）
- [ ] T014 测试启动空Electron应用（npm run dev 验证窗口打开）

---

## Phase 2: 核心基础设施

**目标**: 实现IPC通信机制和服务层架构

**验收标准**:

- [ ] 渲染进程可通过IPC调用主进程命令
- [ ] 错误能正确传递到前端
- [ ] TypeScript类型定义完整且编译通过
- [ ] 日志系统工作正常

### 任务清单

- [x] T015 创建共享类型定义文件 electron/types/index.ts（Photo, Tag, Album等接口）
- [x] T016 创建IPC命令类型定义 electron/types/ipc-commands.ts（所有命令的参数和返回值类型）
- [x] T017 实现IPC处理器注册机制 electron/ipc/handlers.ts（registerHandlers函数）
- [x] T018 [P] 实现错误处理工具 electron/utils/error-handler.ts（统一错误格式转换）
- [x] T019 [P] 实现日志记录工具 electron/utils/logger.ts（控制台和文件日志）
- [x] T020 创建服务基类 electron/services/base-service.ts（通用初始化和错误处理）
- [x] T021 在preload.ts中暴露invoke和on方法到window.electronAPI
- [x] T022 注册测试命令ping到ipcMain handlers（返回pong验证IPC工作）
- [x] T023 更新主进程入口调用registerHandlers并初始化日志系统
- [ ] T024 测试IPC通信（从渲染进程调用ping命令验证往返）

---

## Phase 3: 数据库层迁移

**目标**: 完整迁移SQLite数据库操作到better-sqlite3

**依赖**: Phase 2完成

**验收标准**:

- [ ] 可读取Tauri版本的SQLite数据库文件
- [ ] 所有表的CRUD操作正常
- [ ] 事务支持工作正常
- [ ] FTS5全文搜索功能正常
- [ ] 通过单元测试验证

### 任务清单

- [x] T025 创建DatabaseService类 electron/services/database.ts（构造函数、db属性）
- [x] T026 实现数据库初始化方法 DatabaseService.initialize()（打开连接、设置WAL、外键）
- [x] T027 [P] 实现Photos表CRUD操作（getPhotos, getPhotoById, createPhoto, updatePhoto, deletePhoto）
- [x] T028 [P] 实现Tags表CRUD操作（getAllTags, getTagById, createTag, updateTag, deleteTag）
- [x] T029 [P] 实现Albums表CRUD操作（getAllAlbums, getAlbumById, createAlbum, updateAlbum, deleteAlbum）
- [x] T030 [P] 实现Photo-Tag关联操作（addTagToPhoto, removeTagFromPhoto, getPhotoTags, getPhotosWithTag）
- [x] T031 [P] 实现Album-Photo关联操作（addPhotoToAlbum, removePhotoFromAlbum, getAlbumPhotos）
- [x] T032 实现事务支持方法 DatabaseService.transaction()（包装better-sqlite3事务API）
- [x] T033 实现FTS5全文搜索 DatabaseService.searchPhotos()（查询photos_fts虚拟表）
- [x] T034 实现Settings表操作（getSetting, setSetting, getAllSettings）
- [x] T035 [P] 实现ScanJobs表操作（createScanJob, updateScanJob, getScanJobs）
- [x] T036 [P] 实现统计查询方法（getPhotoCount）
- [x] T037 实现软删除和恢复方法（restorePhoto, deletePhoto with soft flag）
- [ ] T038 实现数据库迁移管理器 electron/services/migration-manager.ts（版本检查和迁移执行）
- [x] T039 注册数据库相关IPC命令到handlers（get_photos, create_tag等）
- [x] T040 导出databaseService单例 electron/services/index.ts
- [ ] T041 测试数据库层（创建测试数据库执行CRUD操作验证）

---

## Phase 4: 文件扫描与图片处理

**目标**: 实现目录扫描、EXIF提取、缩略图生成功能

**依赖**: Phase 3完成

**验收标准**:

- [ ] 可扫描指定目录识别所有图片文件
- [ ] 正确计算文件哈希并检测重复
- [ ] 成功提取EXIF元数据（拍摄时间、相机信息、GPS）
- [ ] 缩略图生成质量和性能可接受（<200ms/张）
- [ ] 进度报告机制工作正常

### 任务清单

- [x] T042 创建ScannerService类 electron/services/scanner.ts（文件遍历框架）
- [x] T043 实现目录递归遍历 ScannerService.walkDirectory()（使用fs.readdir递归）
- [x] T044 实现图片文件识别 ScannerService.isImageFile()（根据扩展名判断）
- [x] T045 实现文件哈希计算 ScannerService.calculateHash()（使用crypto SHA-256）
- [x] T046 实现重复检测逻辑 ScannerService.checkDuplicate()（查询数据库file_hash）
- [x] T047 实现扫描进度报告 ScannerService.reportProgress()（通过IPC发送进度事件）
- [x] T048 实现主扫描流程 ScannerService.scanFolder()（组合遍历、识别、哈希、入库）
- [x] T049 实现扫描取消功能 ScannerService.cancelScan()（设置标志位中断扫描）
- [x] T050 创建ExifService类 electron/services/exif.ts（EXIF提取）
- [x] T051 [P] 安装exifr依赖（npm install exifr@^7.0.0）
- [x] T052 实现EXIF提取方法 ExifService.extractExif()（解析拍摄时间、相机、GPS等）
- [x] T053 集成EXIF提取到扫描流程（在scanFolder中调用extractExif）
- [x] T054 创建ThumbnailService类 electron/services/thumbnail.ts（缩略图生成）
- [x] T055 实现单张缩略图生成 ThumbnailService.generateThumbnail()（使用Sharp resize）
- [x] T056 实现批量缩略图生成 ThumbnailService.generateThumbnailsBatch()（并发控制5个）
- [x] T057 实现缩略图缓存管理 ThumbnailService.cleanupCache()（删除过期缓存）
- [x] T058 注册扫描相关IPC命令（scan_folder, cancel_scan, generate_thumbnail）
- [x] T059 导出scannerService、exifService、thumbnailService单例
- [ ] T060 测试扫描功能（扫描包含1000张测试图片的目录验证性能）

---

## Phase 5: 文件监控与搜索

**目标**: 实现文件系统监控和高级搜索功能

**依赖**: Phase 4完成

**验收标准**:

- [ ] 监控的目录中新增图片自动入库
- [ ] 监控的目录中删除图片自动标记
- [ ] 防抖机制避免频繁触发
- [ ] 复杂筛选条件搜索正常工作
- [ ] 搜索响应时间<200ms

### 任务清单

- [x] T061 [P] 安装chokidar依赖（npm install chokidar@^3.5.0）
- [x] T062 创建WatcherService类 electron/services/watcher.ts（文件监控管理）
- [x] T063 实现目录监控启动 WatcherService.watchDirectory()（配置chokidar监听add/unlink）
- [x] T064 实现新文件处理 WatcherService.handleNewFile()（检测图片并自动扫描入库）
- [x] T065 实现删除文件处理 WatcherService.handleDeletedFile()（标记数据库中图片为已删除）
- [x] T066 实现防抖处理 WatcherService配置awaitWriteFinish（避免文件未写完就处理）
- [x] T067 实现监控停止 WatcherService.unwatchDirectory()和stopAll()
- [x] T068 创建SearchService类 electron/services/search.ts（复杂查询构建）
- [x] T069 实现按筛选条件搜索 SearchService.searchByFilter()（解析FilterCriteria构建SQL）
- [x] T070 实现智能相册查询 SearchService.executeSmartAlbum()（根据保存的filter_json查询）
- [x] T071 集成FTS5全文搜索到SearchService（调用DatabaseService.searchPhotos）
- [x] T072 注册监控和搜索IPC命令（watch_directory, unwatch_directory, search_photos）
- [x] T073 导出watcherService和searchService单例
- [ ] T074 测试监控功能（启动监控后手动添加删除文件验证自动更新）

---

## Phase 6: 前端适配层

**目标**: 创建适配层使前端代码无需修改即可工作

**依赖**: Phase 3, 4, 5完成

**验收标准**:

- [ ] 前端API调用全部正常工作
- [ ] 所有Tauri命令已映射到Electron IPC
- [ ] 类型定义与前端一致
- [ ] 错误处理方式保持一致
- [ ] 所有UI功能测试通过

### 任务清单

- [x] T075 创建Tauri适配器 src/api/tauri-adapter.ts（检测环境选择invoke实现、文件对话框、路径转换）
- [x] T076 更新photos API导入路径 src/api/photos.ts（从@tauri-apps改为./tauri-adapter）
- [x] T077 更新tags API导入路径 src/api/tags.ts（从@tauri-apps改为./tauri-adapter）
- [x] T078 更新albums API导入路径 src/api/albums.ts（从@tauri-apps改为./tauri-adapter）[文件不存在-跳过]
- [x] T079 更新scanner API导入路径 src/api/scanner.ts（从@tauri-apps改为./tauri-adapter）
- [x] T080 更新settings API导入路径 src/api/settings.ts（从@tauri-apps改为./tauri-adapter）[文件不存在-跳过]
- [x] T080.1 [额外] 更新search/recycle/watcher API导入路径（从@tauri-apps改为./tauri-adapter）
- [x] T080.2 [额外] 更新hooks和components导入路径（useImportPhotos, PhotoCard, PhotoDetail, AddWatchDirectoryDialog, watcherStore）
- [x] T080.3 [额外] 实现Electron文件对话框IPC命令（electron/ipc/dialog-handlers.ts）
- [x] T080.4 [额外] 修复模块系统冲突（创建dist-electron/package.json标记为commonjs，添加post-build脚本）
- [x] T080.5 [额外] 清理Tauri代码和依赖（删除src-tauri、更新package.json、更新README.md）
- [x] T080.6 [额外] 简化tauri-adapter.ts移除Tauri向后兼容代码（纯Electron实现）
- [x] T080.7 [额外] 修复重复IPC处理器注册（search_photos_by_filter 在两处注册导致错误）
- [x] T080.8 [额外] 实现数据库自动初始化（创建表结构、索引、FTS5、触发器）
- [ ] T081 [P] 验证图片扫描功能（点击扫描文件夹按钮测试）
- [ ] T082 [P] 验证图片浏览功能（缩略图网格、列表视图、详情页）
- [ ] T083 [P] 验证标签功能（创建、编辑、删除、添加到图片）
- [ ] T084 [P] 验证相册功能（创建相册、添加图片、排序）
- [ ] T085 [P] 验证搜索功能（文本搜索、筛选器、智能相册）
- [ ] T086 [P] 验证回收站功能（软删除、恢复、永久删除）
- [ ] T087 [P] 验证设置功能（主题切换、语言切换、缓存管理）
- [ ] T088 修复前端发现的类型不匹配问题（根据测试结果调整类型定义）
- [ ] T089 测试所有快捷键（确保与Tauri版本一致）
- [ ] T090 测试窗口状态保存（位置、大小、最大化状态）

---

## Phase 7: 跨平台测试与打包

**目标**: 完成三平台测试和安装包构建

**依赖**: Phase 6完成

**验收标准**:

- [ ] Windows平台所有功能正常
- [ ] macOS平台所有功能正常
- [ ] Linux平台所有功能正常
- [ ] 性能指标不低于Tauri版本80%
- [ ] 生成可安装的发布包

### 任务清单

- [ ] T091 配置Windows打包选项 electron-builder.json（NSIS安装器、图标、签名）
- [ ] T092 配置macOS打包选项 electron-builder.json（DMG、图标、category、签名）
- [ ] T093 配置Linux打包选项 electron-builder.json（AppImage、deb、图标）
- [ ] T094 Windows平台完整功能测试（所有Phase 6测试项在Windows上执行）
- [ ] T095 Windows平台性能测试（启动时间、扫描速度、滚动帧率、内存占用）
- [ ] T096 Windows平台路径处理测试（反斜杠路径、特殊字符文件名）
- [ ] T097 macOS平台完整功能测试（所有Phase 6测试项在macOS上执行）
- [ ] T098 macOS平台性能测试（对比Tauri版本性能数据）
- [ ] T099 macOS平台权限测试（文件访问权限、文件夹选择）
- [ ] T100 Linux平台完整功能测试（所有Phase 6测试项在Linux上执行）
- [ ] T101 Linux平台依赖测试（验证libfuse等依赖说明）
- [ ] T102 Linux平台路径处理测试（正斜杠路径、大小写敏感文件系统）
- [ ] T103 [P] 性能优化：数据库查询（启用WAL模式、调整缓存大小、使用预编译语句）
- [ ] T104 [P] 性能优化：Sharp并行处理（调整并发数、配置缓存策略）
- [ ] T105 [P] 性能优化：IPC通信（批量传输、减少往返次数）
- [ ] T106 数据兼容性测试（Tauri数据库→Electron读取验证）
- [ ] T107 升级测试（模拟从Tauri版本升级场景）
- [ ] T108 构建Windows安装包（npm run dist:win 生成NSIS安装器）
- [ ] T109 构建macOS安装包（npm run dist:mac 生成DMG）
- [ ] T110 构建Linux安装包（npm run dist:linux 生成AppImage和deb）
- [ ] T111 测试安装包安装过程（全新安装、覆盖安装、卸载）
- [ ] T112 验证安装包体积（Windows<120MB, macOS<150MB, Linux<130MB）

---

## Phase 8: 文档与发布准备

**目标**: 完善文档并准备发布

**依赖**: Phase 7完成

**验收标准**:

- [ ] 迁移指南文档完整清晰
- [ ] 用户升级说明简单易懂
- [ ] 开发者文档详尽实用
- [ ] 变更日志准确完整
- [ ] README更新反映新技术栈

### 任务清单

- [ ] T113 [P] 编写迁移指南 docs/migration-guide.md（Tauri→Electron变更、API差异对照表）
- [ ] T114 [P] 编写开发者指南 docs/developer-guide.md（项目结构、IPC命令添加、调试技巧）
- [ ] T115 [P] 编写用户升级说明 docs/upgrade-notes.md（数据兼容性、备份建议、降级方法）
- [ ] T116 [P] 编写变更日志 CHANGELOG.md（v2.0.0主要变更、性能对比、已知问题）
- [ ] T117 更新README.md（技术栈说明、安装构建说明、系统要求）
- [ ] T118 更新package.json元数据（版本号、描述、仓库链接）
- [ ] T119 准备发布说明草稿（亮点总结、升级理由、注意事项）
- [ ] T120 创建GitHub Release（上传安装包、发布说明、版本标签）

---

## 依赖关系图

```
Phase 1 (环境搭建)
   ↓
Phase 2 (核心基础设施)
   ↓
Phase 3 (数据库层) ←─────┐
   ↓                    │
Phase 4 (扫描处理)      │
   ↓                    │
Phase 5 (监控搜索)      │
   ↓                    │
Phase 6 (前端适配) ─────┘
   ↓
Phase 7 (测试打包)
   ↓
Phase 8 (文档发布)
```

**关键路径**: Phase 1 → 2 → 3 → 6 → 7 (最短完成路径)

**并行机会**:

- Phase 4和5可部分并行（文件处理和监控独立）
- Phase 7的三平台测试可并行
- Phase 8的文档编写可与Phase 7并行开始

---

## 进度追踪

### 统计

- **总任务数**: 120
- **Phase 1 (环境搭建)**: 14任务
- **Phase 2 (基础设施)**: 10任务
- **Phase 3 (数据库层)**: 17任务
- **Phase 4 (扫描处理)**: 19任务
- **Phase 5 (监控搜索)**: 14任务
- **Phase 6 (前端适配)**: 16任务
- **Phase 7 (测试打包)**: 22任务
- **Phase 8 (文档发布)**: 8任务

### MVP范围

**最小可行产品** (Phase 1-3 + 基本前端适配):

- T001-T041: 环境、IPC、数据库 (41任务)
- T075-T082: 基本前端适配和验证 (8任务)
- **MVP总计**: 49任务，预计5-7天完成

完成MVP后即可进行基本功能演示和早期验证。

### 并行执行建议

**Phase 1并行组**:

- 组A: T001-T003 (安装依赖包)
- 组B: T011-T012 (native模块验证)

**Phase 3并行组**:

- 组A: T027 (Photos CRUD)
- 组B: T028 (Tags CRUD)
- 组C: T029 (Albums CRUD)

**Phase 4并行组**:

- 组A: T042-T049 (扫描核心)
- 组B: T050-T053 (EXIF处理)
- 组C: T054-T057 (缩略图生成)

**Phase 6并行组**:

- 组A: T081-T087 (各功能模块验证)

**Phase 7并行组**:

- 组A: T094-T096 (Windows测试)
- 组B: T097-T099 (macOS测试)
- 组C: T100-T102 (Linux测试)

---

## 风险与注意事项

### 高风险任务

| 任务ID    | 风险               | 缓解措施                                  |
| --------- | ------------------ | ----------------------------------------- |
| T011-T012 | native模块编译失败 | 预先配置各平台编译工具链，准备备选方案    |
| T041      | 数据库兼容性问题   | 充分测试Tauri数据库读取，准备数据迁移脚本 |
| T060      | 扫描性能不达标     | 性能基准测试，优化关键路径，限制并发数    |
| T106      | 数据损坏风险       | 强制用户备份，启动时验证数据库完整性      |

### 阻塞风险

- **Phase 2未完成**: 后续所有Phase无法开始
- **Phase 3未完成**: 无法测试数据访问功能
- **Phase 6未完成**: 无法进行端到端测试

### 质量检查点

- [ ] **QC1** (Phase 2结束): IPC通信机制完整性检查
- [ ] **QC2** (Phase 3结束): 数据库操作单元测试100%通过
- [ ] **QC3** (Phase 6结束): 所有前端功能回归测试通过
- [ ] **QC4** (Phase 7结束): 三平台性能指标达标

---

## 备注

### 开发环境要求

- Node.js 18.x LTS
- pnpm 8.x (或npm/yarn)
- 编译工具链：
  - Windows: Visual Studio Build Tools
  - macOS: Xcode Command Line Tools
  - Linux: build-essential

### 性能目标

- 启动时间: <3秒 (冷启动)
- 扫描速度: >10张/秒
- 搜索响应: <200ms
- 内存占用: 空闲<150MB, 负载<800MB
- 滚动帧率: 60fps (10000张网格)

### 成功标准

1. ✅ 所有120任务完成
2. ✅ 三平台功能完整性验证通过
3. ✅ 性能不低于Tauri版本80%
4. ✅ Tauri数据库完全兼容
5. ✅ 用户升级无感知
6. ✅ 安装包生成成功

---

**最后更新**: 2025-10-29
**任务状态**: 0/120 完成 (0%)
