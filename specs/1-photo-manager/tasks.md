# PhotoMan - 任务清单

## 项目信息

- **项目名称**: PhotoMan 本地图片管理应用
- **技术栈**: Tauri 2.0 + React 18 + TypeScript 5 + Rust
- **开发周期**: 24周（6个月）
- **创建日期**: 2025-10-24
- **状态**: 规划完成，准备开始实施

## 任务统计

- **总任务数**: 156个任务
- **并行任务**: 42个（标记为[P]）
- **用户故事数**: 4个核心场景 + 11个功能需求
- **预计MVP**: 用户故事1（导入和浏览）+ 基础UI

## 实施策略

### MVP优先原则

**MVP范围**（Phase 1-3，约4-6周）:

1. 项目搭建和基础架构
2. 图片扫描和导入
3. 基础浏览（网格视图）
4. 简单的图片查看

**增量交付顺序**:

1. MVP: 能导入和浏览图片
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

- [ ] T045 创建Zustand store结构（src/stores/）
- [ ] T046 [P] 实现应用状态store（src/stores/appStore.ts）
- [ ] T047 [P] 实现设置状态store（src/stores/settingsStore.ts）
- [ ] T048 实现状态持久化（localStorage）

---

## Phase 3: 用户故事1 - 导入和初次浏览 [US1]

**目标**: 用户能够导入图片并在网格视图中浏览

**优先级**: P1（必须，MVP核心）

**独立测试标准**:

- ✅ 用户可以选择文件夹并开始扫描
- ✅ 扫描进度实时显示
- ✅ 扫描完成后显示所有图片的缩略图网格
- ✅ 网格视图流畅滚动（10000+张图片）
- ✅ 点击图片可查看大图

**工期**: 4周

### 3.1 文件扫描 (Rust后端)

- [ ] T049 [US1] 创建scanner模块（src-tauri/src/scanner/mod.rs）
- [ ] T050 [US1] 实现文件系统遍历（src-tauri/src/scanner/walker.rs，使用walkdir）
- [ ] T051 [US1] 实现图片格式检测（src-tauri/src/scanner/detector.rs，使用image crate）
- [ ] T052 [US1] 实现文件哈希计算（src-tauri/src/scanner/hasher.rs，SHA-256）
- [ ] T053 [US1] 实现重复检测逻辑（src-tauri/src/scanner/dedup.rs）
- [ ] T054 [US1] 实现扫描进度报告（使用Tauri事件）
- [ ] T055 [US1] 实现scan_folder Tauri命令（src-tauri/src/commands/scan.rs）
- [ ] T056 [US1] 编写扫描模块单元测试

### 3.2 数据访问层

- [ ] T057 [US1] 创建Photo实体DAO（src-tauri/src/database/photos.rs）
- [ ] T058 [US1] 实现Photo CRUD操作
- [ ] T059 [US1] 实现ScanJob DAO（src-tauri/src/database/scan_jobs.rs）
- [ ] T060 [US1] 实现批量插入优化
- [ ] T061 [US1] 编写DAO单元测试

### 3.3 缩略图生成 (Rust后端)

- [ ] T062 [US1] 创建thumbnail模块（src-tauri/src/thumbnail/mod.rs）
- [ ] T063 [US1] 实现缩略图生成器（src-tauri/src/thumbnail/generator.rs，使用image crate）
- [ ] T064 [US1] 实现多尺寸生成（small 200x200，medium 800x600）
- [ ] T065 [US1] 实现缓存管理（src-tauri/src/thumbnail/cache.rs）
- [ ] T066 [US1] 实现LRU淘汰策略
- [ ] T067 [US1] 实现generate_thumbnail Tauri命令
- [ ] T068 [US1] 实现异步生成（tokio后台任务）
- [ ] T069 [US1] 编写缩略图模块单元测试

### 3.4 前端 - 导入界面

- [ ] T070 [P] [US1] 实现文件夹选择对话框（src/components/FolderPicker.tsx）
- [ ] T071 [P] [US1] 实现扫描进度条组件（src/components/ScanProgress.tsx）
- [ ] T072 [P] [US1] 实现扫描结果摘要组件（src/components/ScanSummary.tsx）
- [ ] T073 [US1] 实现扫描API调用（src/api/scanner.ts）
- [ ] T074 [US1] 实现扫描状态管理（src/stores/scanStore.ts）
- [ ] T075 [US1] 集成Tauri事件监听（扫描进度）

### 3.5 前端 - 网格视图

- [ ] T076 [P] [US1] 实现虚拟滚动网格组件（src/components/PhotoGrid.tsx，使用react-window）
- [ ] T077 [P] [US1] 实现照片卡片组件（src/components/PhotoCard.tsx）
- [ ] T078 [P] [US1] 实现缩略图加载逻辑
- [ ] T079 [P] [US1] 实现图片选择状态（单选、多选）
- [ ] T080 [US1] 实现缩略图大小调整（3档）
- [ ] T081 [US1] 实现照片store（src/stores/photoStore.ts）
- [ ] T082 [US1] 实现图片列表API（src/api/photos.ts）

### 3.6 前端 - 详情视图

- [ ] T083 [P] [US1] 实现图片详情模态框（src/components/PhotoDetail.tsx）
- [ ] T084 [P] [US1] 实现图片缩放和平移（src/components/ImageViewer.tsx）
- [ ] T085 [P] [US1] 实现键盘导航（方向键切换）
- [ ] T086 [P] [US1] 实现图片预加载策略
- [ ] T087 [US1] 实现元数据侧边栏（基础版）

### 3.7 集成测试 [US1]

- [ ] T088 [US1] 编写导入流程端到端测试
- [ ] T089 [US1] 编写网格视图性能测试（10000张图片）
- [ ] T090 [US1] 编写详情视图测试

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

- [ ] T091 [US2] 创建Tag DAO（src-tauri/src/database/tags.rs）
- [ ] T092 [US2] 实现Tag CRUD操作
- [ ] T093 [US2] 实现PhotoTag关联DAO（src-tauri/src/database/photo_tags.rs）
- [ ] T094 [US2] 实现批量标签操作
- [ ] T095 [US2] 实现标签使用统计更新
- [ ] T096 [US2] 编写标签DAO单元测试

### 4.2 标签命令 (Rust后端)

- [ ] T097 [US2] 实现add_tag命令（src-tauri/src/commands/tags.rs）
- [ ] T098 [US2] 实现remove_tag命令
- [ ] T099 [US2] 实现get_all_tags命令
- [ ] T100 [US2] 实现get_photos_by_tag命令
- [ ] T101 [US2] 实现update_tag命令

### 4.3 前端 - 标签UI

- [ ] T102 [P] [US2] 实现标签输入组件（src/components/TagInput.tsx）
- [ ] T103 [P] [US2] 实现标签自动补全功能
- [ ] T104 [P] [US2] 实现标签选择器组件（src/components/TagSelector.tsx）
- [ ] T105 [P] [US2] 实现标签显示组件（src/components/TagChip.tsx）
- [ ] T106 [US2] 实现标签管理页面（src/pages/TagManagement.tsx）
- [ ] T107 [US2] 实现批量标签操作UI
- [ ] T108 [US2] 实现标签状态管理（src/stores/tagStore.ts）
- [ ] T109 [US2] 实现标签API封装（src/api/tags.ts）

### 4.4 标签筛选

- [ ] T110 [US2] 实现标签筛选栏（src/components/TagFilter.tsx）
- [ ] T111 [US2] 实现筛选逻辑集成
- [ ] T112 [US2] 实现标签筛选状态管理

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

- [ ] T116 [US3] 实现搜索模块（src-tauri/src/search/mod.rs）
- [ ] T117 [US3] 实现全文搜索索引（SQLite FTS5）
- [ ] T118 [US3] 实现search_photos命令（src-tauri/src/commands/search.rs）
- [ ] T119 [US3] 实现高级筛选逻辑
- [ ] T120 [US3] 实现组合查询构建器
- [ ] T121 [US3] 优化搜索性能（索引、缓存）
- [ ] T122 [US3] 编写搜索模块单元测试

### 5.2 前端 - 搜索UI

- [ ] T123 [P] [US3] 实现搜索栏组件（src/components/SearchBar.tsx）
- [ ] T124 [P] [US3] 实现搜索结果高亮
- [ ] T125 [P] [US3] 实现高级筛选面板（src/components/AdvancedFilter.tsx）
- [ ] T126 [P] [US3] 实现筛选条件构建器UI
- [ ] T127 [US3] 实现搜索历史记录（src/stores/searchStore.ts）
- [ ] T128 [US3] 实现智能相册（保存筛选条件）
- [ ] T129 [US3] 实现搜索API封装（src/api/search.ts）

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

- [ ] T133 [US4] 实现软删除命令（src-tauri/src/commands/recycle.rs）
- [ ] T134 [US4] 实现恢复命令
- [ ] T135 [US4] 实现永久删除命令
- [ ] T136 [US4] 实现回收站清理任务（定期清理30天前的）
- [ ] T137 [US4] 实现回收站查询（src-tauri/src/database/recycle.rs）
- [ ] T138 [US4] 编写回收站模块单元测试

### 6.2 前端 - 回收站UI

- [ ] T139 [P] [US4] 实现删除确认对话框（src/components/DeleteConfirm.tsx）
- [ ] T140 [P] [US4] 实现回收站页面（src/pages/RecycleBin.tsx）
- [ ] T141 [P] [US4] 实现恢复操作UI
- [ ] T142 [P] [US4] 实现清空回收站UI
- [ ] T143 [US4] 实现回收站状态管理（src/stores/recycleStore.ts）
- [ ] T144 [US4] 实现回收站API封装（src/api/recycle.ts）

### 6.3 集成测试 [US4]

- [ ] T145 [US4] 编写删除流程测试
- [ ] T146 [US4] 编写恢复流程测试
- [ ] T147 [US4] 编写永久删除测试

---

## Phase 7: 高级功能和优化

**目标**: 完善其他功能需求（相册、EXIF编辑、批量操作等）

**优先级**: P2-P3

**工期**: 6周

### 7.1 相册功能

- [ ] T148 [P] 实现Album DAO（src-tauri/src/database/albums.rs）
- [ ] T149 [P] 实现相册命令（src-tauri/src/commands/albums.rs）
- [ ] T150 [P] 实现相册UI（src/pages/Albums.tsx）
- [ ] T151 [P] 实现拖放添加图片到相册

### 7.2 EXIF编辑

- [ ] T152 [P] 实现EXIF解析模块（src-tauri/src/exif/mod.rs，使用kamadak-exif）
- [ ] T153 [P] 实现EXIF编辑命令
- [ ] T154 [P] 实现元数据编辑UI（src/components/MetadataEditor.tsx）
- [ ] T155 [P] 实现批量元数据编辑

### 7.3 批量操作

- [ ] T156 [P] 实现批量移动/复制命令
- [ ] T157 [P] 实现批量重命名命令
- [ ] T158 [P] 实现批量导出命令
- [ ] T159 [P] 实现批量操作UI（src/components/BulkActions.tsx）

### 7.4 设置系统

- [ ] T160 [P] 实现设置DAO（src-tauri/src/database/settings.rs）
- [ ] T161 [P] 实现设置命令
- [ ] T162 [P] 实现设置页面（src/pages/Settings.tsx）
- [ ] T163 [P] 实现导入/导出设置

### 7.5 自动备份

- [ ] T164 实现备份调度器（src-tauri/src/backup/scheduler.rs）
- [ ] T165 实现备份命令
- [ ] T166 实现恢复命令
- [ ] T167 实现备份UI

### 7.6 增量扫描

- [ ] T168 实现文件系统监控（src-tauri/src/scanner/watcher.rs，使用notify crate）
- [ ] T169 实现自动增量扫描
- [ ] T170 实现监控设置UI

---

## Phase 8: 打磨和发布准备

**目标**: 性能优化、跨平台测试、文档完善

**工期**: 3周

### 8.1 性能优化

- [ ] T171 数据库查询性能优化
- [ ] T172 前端渲染性能优化
- [ ] T173 内存使用优化
- [ ] T174 启动时间优化
- [ ] T175 大图库性能测试和调优（50000+张）

### 8.2 跨平台测试

- [ ] T176 Windows平台完整测试
- [ ] T177 macOS平台完整测试
- [ ] T178 Linux平台完整测试
- [ ] T179 修复平台特定问题

### 8.3 UI/UX打磨

- [ ] T180 加载状态优化
- [ ] T181 错误提示优化
- [ ] T182 空状态设计
- [ ] T183 动画和过渡效果
- [ ] T184 快捷入门引导

### 8.4 文档完善

- [ ] T185 编写用户手册
- [ ] T186 编写快速入门指南
- [ ] T187 编写FAQ文档
- [ ] T188 编写API文档（插件开发）
- [ ] T189 编写变更日志

### 8.5 打包和发布

- [ ] T190 配置Windows打包
- [ ] T191 配置macOS打包和签名
- [ ] T192 配置Linux打包（AppImage/deb/rpm）
- [ ] T193 测试安装包
- [ ] T194 准备发布说明

---

## 依赖关系图

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation)
    ↓
    ├─→ Phase 3 (US1: 导入和浏览) ← MVP核心
    │       ↓
    │   ├─→ Phase 4 (US2: 标签组织)
    │   │
    │   ├─→ Phase 5 (US3: 搜索筛选)
    │   │
    │   └─→ Phase 6 (US4: 删除恢复)
    ↓
Phase 7 (高级功能) ← 可并行
    ↓
Phase 8 (打磨发布)
```

### 关键路径

```
T001-T022 (Setup) → T023-T048 (Foundation) →
T049-T090 (US1) → T091-T115 (US2) →
T116-T132 (US3) → T133-T147 (US4) →
T148-T170 (高级) → T171-T194 (发布)
```

## 并行执行示例

### Setup阶段并行

```bash
# 同时进行的任务组
Group 1: T006, T007, T008, T009, T010  # 前端配置
Group 2: T011, T012, T013, T014        # 后端配置
Group 3: T019, T020, T021              # 测试框架
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

- [ ] 用户可以选择文件夹并导入图片
- [ ] 扫描进度实时显示
- [ ] 网格视图流畅显示缩略图
- [ ] 支持10000+张图片流畅浏览
- [ ] 点击图片可查看大图
- [ ] 支持键盘导航
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
**总任务数**: 194个  
**预计工期**: 24周  
**建议团队**: 2-3名开发者（1名Rust后端 + 1-2名前端/全栈）
