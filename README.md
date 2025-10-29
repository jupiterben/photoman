# PhotoMan - 本地图片管理应用

PhotoMan 是一个注重隐私、性能优异的本地图片管理应用，帮助你轻松组织和管理海量照片。

## 特性

- 🔒 **隐私至上**: 所有数据完全本地存储，无云端传输
- ⚡ **高性能**: 支持10000+张图片流畅浏览
- 🎨 **直观界面**: 现代化UI设计，3次点击完成核心操作
- 🔄 **数据安全**: 完善的撤销机制和数据保护
- 🔌 **可扩展**: 支持插件系统，可自定义功能
- 💻 **跨平台**: 支持Windows、macOS和Linux

## 核心功能

- 图片导入和自动扫描
- 快速缩略图生成和浏览
- 智能标签和分类
- 强大的搜索和过滤
- 批量操作支持
- 元数据编辑
- 键盘快捷键支持

## 项目原则

PhotoMan 项目遵循严格的开发原则，详见 [项目宪章](.specify/memory/constitution.md)，包括：

- **隐私至上**: 数据完全本地化
- **性能优先**: 确保流畅体验
- **用户体验至上**: 直观易用
- **数据完整性**: 保护用户数据
- **可扩展性**: 模块化架构
- **跨平台兼容**: 支持主流平台

## 技术栈

- **桌面框架**: Electron 28+
- **前端**: React 18 + TypeScript 5
- **状态管理**: Zustand
- **数据库**: SQLite (better-sqlite3)
- **后端**: Node.js + TypeScript
- **图片处理**: Sharp (Node.js)
- **UI 库**: Ant Design / Custom Components

## 开发指南

### 环境要求

- **Node.js**: 18.x 或更高（推荐 20.x LTS）
- **pnpm**: 8.x 或更高（推荐）
- **Git**: 2.x
- **构建工具** (Windows): Visual Studio Build Tools 或 windows-build-tools

### 安装依赖

```bash
# 安装所有依赖（前端 + Electron）
pnpm install

# 编译 native 模块（better-sqlite3, sharp）
pnpm rebuild
```

> 详细的 pnpm 配置和使用说明，请参考 [PNPM_SETUP.md](./PNPM_SETUP.md)

### 运行开发环境

```bash
# 启动 Electron 应用（前端 + 后端）
pnpm dev:electron

# 或分别启动（用于调试）
pnpm dev:vite          # 启动前端开发服务器
pnpm dev:electron-start # 启动 Electron 窗口
```

### 构建

```bash
# 构建全部（前端 + Electron 后端）
pnpm build:all

# 打包为安装程序
pnpm dist           # 当前平台
pnpm dist:win       # Windows (NSIS)
pnpm dist:mac       # macOS (DMG)
pnpm dist:linux     # Linux (AppImage + deb)

# 仅构建前端
pnpm build

# 仅构建 Electron 后端
pnpm build:electron
```

## 项目结构

```
photoman/
├── .specify/              # 项目规范和模板
│   ├── memory/           # 项目宪章等核心文档
│   └── templates/        # 各类文档模板
├── src/                  # 源代码
├── tests/                # 测试文件
└── docs/                 # 文档
```

## 贡献指南

在贡献前，请仔细阅读 [项目宪章](.specify/memory/constitution.md) 以了解项目的核心原则和要求。

## 许可证

[待定]

## 联系方式

[待补充]

