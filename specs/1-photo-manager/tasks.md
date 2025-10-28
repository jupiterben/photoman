# PhotoMan - 任务清单

## 项目信息

- **项目名称**: PhotoMan 本地图片管理应用
- **技术栈**: Tauri 2.0 + React 18 + TypeScript 5 + Rust
- **开发周期**: 21周（5个月）
- **创建日期**: 2025-10-24
- **状态**: 规划完成，准备开始实施

## 任务统计

- **总任务数**: 184个任务（新增监控目录管理 37个任务）
- **并行任务**: 41个（标记为[P]）
- **用户故事数**: 4个核心场景
- **预计MVP**: 用户故事1（监控目录和浏览）+ 基础UI

## 实施策略

### MVP优先原则

**MVP范围**（Phase 1-3，约6-8周）:

1. 项目搭建和基础架构
2. 监控目录管理和实时同步
3. 图片扫描和索引
4. 基础浏览（网格视图）
5. 简单的图片查看

**增量交付顺序**:

1. MVP: 能添加监控目录并自动同步浏览图片
2. US2: 添加标签组织功能
3. US3: 添加搜索功能
4. US4: 添加删除和回收站
5. 完善所有高级功能

### 并行执行策略

- **Setup阶段**: 前端和后端可并行搭建
- **每个用户故事内**: 前端组件和后端服务可并行开发
- **测试**: 单元测试与功能开发并行

---

## Phase 1: 项目设置与环境搭建

**目标**: 完成Tauri项目初始化和开发环境配置

**工期**: 2周

### 1.1 项目初始化

- [x] T001 使用create-tauri-app创建项目骨架
- [x] T002 配置Git仓库和.gitignore文件
- [x] T003 配置ESLint和Prettier规则
- [x] T004 创建项目目录结构（src/、src-tauri/src/）
- [x] T005 配置TypeScript编译选项（tsconfig.json）

### 1.2 前端环境

- [x] T006 [P] 配置Vite构建工具（vite.config.ts）
- [x] T007 [P] 安装React 18和相关依赖（package.json）
- [x] T008 [P] 配置Tailwind CSS或UI库（antd/MUI）
- [x] T009 [P] 配置react-i18next国际化（src/i18n/index.ts）
- [x] T010 [P] 创建中英文语言文件（src/i18n/locales/）

### 1.3 Rust后端环境

- [x] T011 [P] 配置Cargo.toml依赖（tauri、rusqlite、image等）
- [x] T012 [P] 创建Rust模块结构（src-tauri/src/）
- [x] T013 [P] 配置Tauri应用配置（tauri.conf.json）
- [x] T014 [P] 设置Rust日志系统（env_logger）

### 1.4 开发工具

- [x] T015 配置VSCode工作区设置（.vscode/settings.json）
- [x] T016 配置rust-analyzer和相关扩展
- [x] T017 创建开发文档（CONTRIBUTING.md）
- [x] T018 配置Git hooks（可选，格式化检查）

### 1.5 测试框架

- [x] T019 [P] 配置Jest和React Testing Library（前端测试）
- [x] T020 [P] 配置cargo test（Rust单元测试）
- [x] T021 [P] 配置Playwright（端到端测试）
- [x] T022 编写测试示例和文档

---

## Phase 2: 核心基础设施

**目标**: 实现数据库、Tauri命令系统等核心基础设施

**前置条件**: Phase 1完成

**工期**: 4周

### 2.1 数据库初始化

- [x] T023 创建数据库模块结构（src-tauri/src/database/）
- [x] T024 实现数据库连接管理（src-tauri/src/database/connection.rs）
- [x] T025 实现Schema初始化SQL（src-tauri/src/database/schema.sql）
- [x] T026 实现photos表创建和索引（src-tauri/src/database/migrations/001_photos.rs）
- [x] T027 [P] 实现tags表创建和索引（src-tauri/src/database/migrations/002_tags.rs）
- [x] T028 [P] 实现albums表创建和索引（src-tauri/src/database/migrations/003_albums.rs）
- [x] T029 [P] 实现关联表创建（photo_tags、album_photos）
- [x] T030 [P] 实现辅助表创建（scan_jobs、thumbnail_cache、settings）
- [x] T031 实现数据库迁移机制（src-tauri/src/database/migrator.rs）
- [x] T032 编写数据库初始化单元测试

### 2.2 Tauri命令系统

- [x] T033 创建commands模块（src-tauri/src/commands/mod.rs）
- [x] T034 实现Tauri State管理结构（src-tauri/src/state.rs）
- [x] T035 实现错误类型定义（src-tauri/src/error.rs）
- [x] T036 在main.rs中注册命令处理器
- [x] T037 创建前端API封装（src/api/tauri.ts）

### 2.3 基础UI框架

- [x] T038 实现App主组件布局（src/App.tsx）
- [x] T039 实现侧边栏组件（src/components/Sidebar.tsx）
- [x] T040 实现顶部工具栏组件（src/components/Toolbar.tsx）
- [x] T041 实现主内容区域组件（src/components/MainView.tsx）
- [x] T042 实现路由配置（如使用React Router）
- [x] T043 实现主题切换功能（亮色/暗色/跟随系统）
- [x] T044 实现语言切换功能（中文/英文）

### 2.4 状态管理

- [x] T045 创建Zustand store结构（src/stores/）
- [x] T046 [P] 实现应用状态store（src/stores/appStore.ts）
- [x] T047 [P] 实现设置状态store（src/stores/settingsStore.ts）
- [x] T048 实现状态持久化（localStorage）

### 2.5 监控目录管理

**目标**: 实现文件系统监控目录的添加、管理和实时同步功能

**前置条件**: Phase 2.1-2.4 完成

**工期**: 2周

#### 2.5.1 监控目录数据层 (Rust后端)

- [x] T172 创建WatchedDirectory实体（src-tauri/src/database/models.rs）
- [x] T173 实现watched_directories表迁移（src-tauri/src/database/migrations/）
- [x] T174 实现WatchedDirectory DAO（src-tauri/src/database/watched_directories.rs）
- [x] T175 实现CRUD操作（create、read、update、delete、list）
- [x] T176 实现监控状态更新（active、paused、error）
- [x] T177 实现统计信息查询（图片数量、最后同步时间）

#### 2.5.2 文件系统监控 (Rust后端)

- [ ] T178 配置notify crate依赖（Cargo.toml）
- [ ] T179 创建watcher模块（src-tauri/src/watcher/mod.rs）
- [ ] T180 实现文件系统事件监听器（src-tauri/src/watcher/listener.rs）
- [ ] T181 实现事件处理器（新增、修改、删除文件）
- [ ] T182 实现监控器生命周期管理（启动、暂停、恢复、停止）
- [ ] T183 实现多目录并发监控
- [ ] T184 实现监控状态同步到数据库
- [ ] T185 实现文件变化事件发送到前端（Tauri事件）

#### 2.5.3 监控目录命令 (Rust后端)

- [ ] T186 实现add_watched_directory命令（src-tauri/src/commands/watcher.rs）
- [ ] T187 实现remove_watched_directory命令
- [ ] T188 实现pause_watched_directory命令
- [ ] T189 实现resume_watched_directory命令
- [ ] T190 实现get_watched_directories命令
- [ ] T191 实现get_watched_directory_stats命令
- [ ] T192 实现rescan_watched_directory命令（手动触发重新扫描）
- [ ] T193 集成监控器到应用启动流程

#### 2.5.4 前端 - 监控目录管理页面

- [ ] T194 [P] 实现监控目录列表组件（src/components/WatchedDirectoryList.tsx）
- [ ] T195 [P] 实现添加监控目录对话框（src/components/AddWatchDirectoryDialog.tsx）
- [ ] T196 [P] 实现监控目录卡片组件（src/components/WatchDirectoryCard.tsx）
- [ ] T197 实现监控目录管理页面（src/pages/WatchedDirectories.tsx）
- [ ] T198 实现监控状态指示器（active、paused、error）
- [ ] T199 实现监控目录操作（暂停、恢复、移除、重新扫描）
- [ ] T200 实现监控目录状态管理（src/stores/watcherStore.ts）
- [ ] T201 实现监控目录API封装（src/api/watcher.ts）
- [ ] T202 集成实时文件变化通知到UI

#### 2.5.5 集成和优化

- [ ] T203 更新扫描命令以支持监控目录模式
- [ ] T204 实现首次扫描完成后自动启动监控
- [ ] T205 实现监控目录配置持久化
- [ ] T206 实现错误恢复机制（监控失败时重试）
- [ ] T207 优化监控性能（防抖、批量处理）
- [ ] T208 编写监控模块单元测试

---

## Phase 3: 用户故事1 - 添加监控目录并浏览 [US1]

**目标**: 用户能够添加监控目录，系统自动同步图片并在网格视图中浏览

**优先级**: P1（必须，MVP核心）

**独立测试标准**:

- ✅ 用户可以添加监控目录并开始首次扫描
- ✅ 扫描进度实时显示
- ✅ 扫描完成后自动启动文件系统监控
- ✅ 新增/删除/修改的图片自动同步（延迟<5秒）
- ✅ 扫描完成后显示所有图片的缩略图网格
- ✅ 网格视图流畅滚动（10000+张图片）
- ✅ 点击图片可查看大图
- ✅ 监控目录状态实时更新

**工期**: 4周

### 3.1 文件扫描 (Rust后端)

- [x] T049 [US1] 创建scanner模块（src-tauri/src/scanner/mod.rs）
- [x] T050 [US1] 实现文件系统遍历（src-tauri/src/scanner/walker.rs，使用walkdir）
- [x] T051 [US1] 实现图片格式检测（src-tauri/src/scanner/detector.rs，使用image crate）
- [x] T052 [US1] 实现文件哈希计算（src-tauri/src/scanner/hasher.rs，SHA-256）
- [x] T053 [US1] 实现重复检测逻辑（src-tauri/src/scanner/dedup.rs）
- [x] T054 [US1] 实现扫描进度报告（使用Tauri事件）
- [x] T055 [US1] 实现scan_folder Tauri命令（src-tauri/src/commands/scan.rs）
- [ ] T056 [US1] 编写扫描模块单元测试

### 3.2 数据访问层

- [x] T057 [US1] 创建Photo实体DAO（src-tauri/src/database/photos.rs）
- [x] T058 [US1] 实现Photo CRUD操作
- [x] T059 [US1] 实现ScanJob DAO（src-tauri/src/database/scan_jobs.rs）
- [x] T060 [US1] 实现批量插入优化
- [x] T061 [US1] 编写DAO单元测试

### 3.3 缩略图生成 (Rust后端)

- [x] T062 [US1] 创建thumbnail模块（src-tauri/src/thumbnail/mod.rs）
- [x] T063 [US1] 实现缩略图生成器（src-tauri/src/thumbnail/generator.rs，使用image crate）
- [x] T064 [US1] 实现多尺寸生成（small 200x200，medium 800x600）
- [x] T065 [US1] 实现缓存管理（src-tauri/src/thumbnail/cache.rs）
- [x] T066 [US1] 实现LRU淘汰策略
- [x] T067 [US1] 实现generate_thumbnail Tauri命令
- [x] T068 [US1] 实现异步生成（tokio后台任务）
- [ ] T069 [US1] 编写缩略图模块单元测试

### 3.4 前端 - 导入界面

- [x] T070 [P] [US1] 实现文件夹选择对话框（src/components/FolderPicker.tsx）
- [x] T071 [P] [US1] 实现扫描进度条组件（src/components/ScanProgress.tsx）
- [x] T072 [P] [US1] 实现扫描结果摘要组件（集成到ScanProgress）
- [x] T073 [US1] 实现扫描API调用（src/api/scanner.ts）
- [x] T074 [US1] 实现扫描状态管理（src/stores/scanStore.ts）
- [x] T075 [US1] 集成Tauri事件监听（扫描进度）

### 3.5 前端 - 网格视图

- [x] T076 [P] [US1] 实现虚拟滚动网格组件（src/components/PhotoGrid.tsx，使用react-window）
- [x] T077 [P] [US1] 实现照片卡片组件（src/components/PhotoCard.tsx）
- [x] T078 [P] [US1] 实现缩略图加载逻辑
- [x] T079 [P] [US1] 实现图片选择状态（单选、多选）
- [x] T080 [US1] 实现缩略图大小调整（3档）
- [x] T081 [US1] 实现照片store（src/stores/photoStore.ts）
- [x] T082 [US1] 实现图片列表API（src/api/photos.ts）

### 3.6 前端 - 详情视图

- [x] T083 [P] [US1] 实现图片详情模态框（src/components/PhotoDetail.tsx）
- [x] T084 [P] [US1] 实现图片缩放和平移（src/components/ImageViewer.tsx）
- [x] T085 [P] [US1] 实现键盘导航（方向键切换）
- [x] T086 [P] [US1] 实现图片预加载策略
- [x] T087 [US1] 实现元数据侧边栏（基础版）

### 3.7 集成测试 [US1]

- [x] T088 [US1] 编写导入流程端到端测试
- [x] T089 [US1] 编写网格视图性能测试（10000张图片）
- [x] T090 [US1] 编写详情视图测试

---

## Phase 4: 用户故事2 - 使用标签组织照片 [US2]

**目标**: 用户能够为照片添加标签并通过标签筛选

**优先级**: P1（必须）

**前置条件**: US1完成

**独立测试标准**:

- ✅ 用户可以为单张或多张照片添加标签
- ✅ 标签输入支持自动补全
- ✅ 用户可以通过标签筛选照片
- ✅ 标签管理页面可以查看、编辑、删除标签

**工期**: 3周

### 4.1 标签数据层 (Rust后端)

- [x] T091 [US2] 创建Tag DAO（src-tauri/src/database/tags.rs）
- [x] T092 [US2] 实现Tag CRUD操作
- [x] T093 [US2] 实现PhotoTag关联DAO（src-tauri/src/database/photo_tags.rs）
- [x] T094 [US2] 实现批量标签操作
- [x] T095 [US2] 实现标签使用统计更新
- [ ] T096 [US2] 编写标签DAO单元测试

### 4.2 标签命令 (Rust后端)

- [x] T097 [US2] 实现add_tag命令（src-tauri/src/commands/tags.rs）
- [x] T098 [US2] 实现remove_tag命令
- [x] T099 [US2] 实现get_all_tags命令
- [x] T100 [US2] 实现get_photos_by_tag命令
- [x] T101 [US2] 实现update_tag命令

### 4.3 前端 - 标签UI

- [x] T102 [P] [US2] 实现标签输入组件（src/components/TagInput.tsx）
- [x] T103 [P] [US2] 实现标签自动补全功能
- [x] T104 [P] [US2] 实现标签选择器组件（src/components/TagSelector.tsx）
- [x] T105 [P] [US2] 实现标签显示组件（src/components/TagChip.tsx）
- [x] T106 [US2] 实现标签管理页面（src/pages/TagManagement.tsx）
- [x] T107 [US2] 实现批量标签操作UI
- [x] T108 [US2] 实现标签状态管理（src/stores/tagStore.ts）
- [x] T109 [US2] 实现标签API封装（src/api/tags.ts）

### 4.4 标签筛选

- [x] T110 [US2] 实现标签筛选栏（src/components/TagFilter.tsx）
- [x] T111 [US2] 实现筛选逻辑集成
- [x] T112 [US2] 实现标签筛选状态管理

### 4.5 集成测试 [US2]

- [ ] T113 [US2] 编写标签添加流程测试
- [ ] T114 [US2] 编写批量标签操作测试
- [ ] T115 [US2] 编写标签筛选测试

---

## Phase 5: 用户故事3 - 快速查找特定照片 [US3]

**目标**: 用户能够通过搜索和筛选快速找到照片

**优先级**: P1（必须）

**前置条件**: US1, US2完成

**独立测试标准**:

- ✅ 搜索响应时间<200ms（10000张图片）
- ✅ 支持文件名、标签、备注的全文搜索
- ✅ 支持高级筛选（日期范围、文件大小、格式）
- ✅ 支持组合筛选条件

**工期**: 3周

### 5.1 搜索引擎 (Rust后端)

- [x] T116 [US3] 实现搜索模块（src-tauri/src/search/mod.rs）
- [x] T117 [US3] 实现全文搜索索引（SQLite LIKE查询）
- [x] T118 [US3] 实现search_photos命令（src-tauri/src/commands/search.rs）
- [x] T119 [US3] 实现高级筛选逻辑
- [x] T120 [US3] 实现组合查询构建器
- [x] T121 [US3] 优化搜索性能（索引、缓存）
- [ ] T122 [US3] 编写搜索模块单元测试

### 5.2 前端 - 搜索UI

- [x] T123 [P] [US3] 实现搜索栏组件（src/components/SearchBar.tsx）
- [x] T124 [P] [US3] 实现搜索结果高亮
- [x] T125 [P] [US3] 实现高级筛选面板（src/components/AdvancedFilter.tsx）
- [x] T126 [P] [US3] 实现筛选条件构建器UI
- [x] T127 [US3] 实现搜索历史记录（src/stores/searchStore.ts）
- [x] T128 [US3] 实现智能相册（保存筛选条件）
- [x] T129 [US3] 实现搜索API封装（src/api/search.ts）

### 5.3 集成测试 [US3]

- [ ] T130 [US3] 编写搜索功能测试
- [ ] T131 [US3] 编写搜索性能测试
- [ ] T132 [US3] 编写筛选功能测试

---

## Phase 6: 用户故事4 - 安全删除和恢复 [US4]

**目标**: 用户能够安全删除照片并从回收站恢复

**优先级**: P1（必须）

**前置条件**: US1完成

**独立测试标准**:

- ✅ 删除操作有明确确认提示
- ✅ 照片移至回收站而非直接删除
- ✅ 回收站显示删除日期和原位置
- ✅ 用户可以恢复单张或多张照片
- ✅ 恢复操作完整还原所有元数据

**工期**: 2周

### 6.1 回收站逻辑 (Rust后端)

- [x] T133 [US4] 实现软删除命令（src-tauri/src/commands/recycle.rs）
- [x] T134 [US4] 实现恢复命令
- [x] T135 [US4] 实现永久删除命令
- [x] T136 [US4] 实现回收站清理任务（定期清理30天前的）
- [x] T137 [US4] 实现回收站查询（src-tauri/src/database/recycle.rs）
- [ ] T138 [US4] 编写回收站模块单元测试

### 6.2 前端 - 回收站UI

- [x] T139 [P] [US4] 实现删除确认对话框（src/components/DeleteConfirm.tsx）
- [x] T140 [P] [US4] 实现回收站页面（src/pages/RecycleBin.tsx）
- [x] T141 [P] [US4] 实现恢复操作UI
- [x] T142 [P] [US4] 实现清空回收站UI
- [x] T143 [US4] 实现回收站状态管理（src/stores/recycleStore.ts）
- [x] T144 [US4] 实现回收站API封装（src/api/recycle.ts）

### 6.3 集成测试 [US4]

- [ ] T145 [US4] 编写删除流程测试
- [ ] T146 [US4] 编写恢复流程测试
- [ ] T147 [US4] 编写永久删除测试

---

## Phase 7: 打磨和发布准备

**目标**: 性能优化、跨平台测试、文档完善

**工期**: 3周

### 7.1 性能优化

- [ ] T148 数据库查询性能优化
- [ ] T149 前端渲染性能优化
- [ ] T150 内存使用优化
- [ ] T151 启动时间优化
- [ ] T152 大图库性能测试和调优（50000+张）

### 7.2 跨平台测试

- [ ] T153 Windows平台完整测试
- [ ] T154 macOS平台完整测试
- [ ] T155 Linux平台完整测试
- [ ] T156 修复平台特定问题

### 7.3 UI/UX打磨

- [x] T157 加载状态优化
- [x] T158 错误提示优化
- [x] T159 空状态设计
- [x] T160 动画和过渡效果
- [ ] T161 快捷入门引导

### 7.4 文档完善

- [ ] T162 编写用户手册
- [x] T163 编写快速入门指南
- [ ] T164 编写FAQ文档
- [ ] T165 编写API文档（插件开发）
- [x] T166 编写变更日志

### 7.5 打包和发布

- [ ] T167 配置Windows打包
- [ ] T168 配置macOS打包和签名
- [ ] T169 配置Linux打包（AppImage/deb/rpm）
- [ ] T170 测试安装包
- [ ] T171 准备发布说明

---

## 依赖关系图

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation + 监控目录管理)
    ↓
    ├─→ Phase 3 (US1: 监控目录和浏览) ← MVP核心
    │       ↓
    │   ├─→ Phase 4 (US2: 标签组织)
    │   │
    │   ├─→ Phase 5 (US3: 搜索筛选)
    │   │
    │   └─→ Phase 6 (US4: 删除恢复)
    ↓
Phase 7 (打磨发布)
```

### 关键路径

```
T001-T022 (Setup) → T023-T048 (Foundation) →
T172-T208 (监控目录管理) → T049-T090 (US1) →
T091-T115 (US2) → T116-T132 (US3) →
T133-T147 (US4) → T148-T171 (发布)
```

## 并行执行示例

### Setup阶段并行

```bash
# 同时进行的任务组
Group 1: T006, T007, T008, T009, T010  # 前端配置
Group 2: T011, T012, T013, T014        # 后端配置
Group 3: T019, T020, T021              # 测试框架
```

### 监控目录管理阶段并行

```bash
# 前端和后端可并行开发
Backend Group 1: T172-T177  # 数据层
Backend Group 2: T178-T185  # 文件系统监控
Backend Group 3: T186-T193  # 命令层
Frontend: T194-T202         # UI组件

# 前端UI组件并行
Group 1: T194, T195, T196   # 监控目录列表和卡片
```

### US1阶段并行

```bash
# 前端和后端可并行开发
Backend: T049-T069 (扫描和缩略图)
Frontend: T070-T087 (UI组件)

# 同一层级组件并行
Group 1: T070, T071, T072  # 导入UI组件
Group 2: T076, T077, T078  # 网格UI组件
Group 3: T083, T084, T085  # 详情UI组件
```

## MVP检查清单

在发布MVP前，确保以下功能完整可用：

- [ ] 用户可以添加监控目录
- [ ] 首次扫描进度实时显示
- [ ] 扫描完成后自动启动文件系统监控
- [ ] 新增/删除文件自动同步（延迟<5秒）
- [ ] 监控目录状态正常显示（active、paused、error）
- [ ] 网格视图流畅显示缩略图
- [ ] 支持10000+张图片流畅浏览
- [ ] 点击图片可查看大图
- [ ] 支持键盘导航
- [ ] 可以暂停、恢复、移除监控目录
- [ ] 应用启动时间<3秒
- [ ] 界面响应流畅（无明显卡顿）
- [ ] 跨平台基本功能正常

## 测试覆盖要求

- **单元测试**: 后端核心模块覆盖率>80%
- **集成测试**: 每个用户故事至少2个集成测试
- **端到端测试**: 关键用户流程全覆盖
- **性能测试**: 大图库测试（10000, 50000张）
- **跨平台测试**: Windows/macOS/Linux各至少1轮完整测试

## 进度追踪

### 完成标准

每个任务完成需满足：

1. 代码实现完成
2. 代码审查通过
3. 相关测试通过
4. 文档更新（如需要）

### 每周检查点

每周五检查：

- 本周完成的任务数
- 阻塞的任务和原因
- 下周计划任务
- 风险和问题

### 里程碑验收

每个Phase完成后验收：

- 所有任务完成
- 独立测试标准通过
- Demo演示成功
- 文档齐全

---

**生成日期**: 2025-10-24  
**最后更新**: 2025-10-28（新增监控目录管理任务）  
**总任务数**: 208个（包含37个监控目录管理任务）  
**预计工期**: 23周（约5.5个月）  
**建议团队**: 2-3名开发者（1名Rust后端 + 1-2名前端/全栈）
