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

- **桌面框架**: Tauri 2.0
- **前端**: React 18 + TypeScript 5
- **状态管理**: Zustand
- **数据库**: SQLite (rusqlite)
- **后端语言**: Rust
- **图片处理**: image crate (Rust)
- **UI 库**: Ant Design / Custom Components

## 开发指南

### 环境要求

- **Node.js**: 18.x 或更高
- **Rust**: 1.75+ (通过 rustup 安装)
- **pnpm**: 8.x 或更高（推荐）
- **Git**: 2.x

### 安装依赖

```bash
# 安装前端依赖
pnpm install

# Rust 依赖会在首次构建时自动安装
```

### 运行开发环境

```bash
# 启动开发服务器（前端 + 后端）
pnpm run tauri dev

# 或使用调试脚本（启用详细日志）
./debug-scan.bat  # Windows
```

### 构建

```bash
# 构建生产版本
pnpm run tauri build

# 仅构建前端
pnpm run build

# 检查 Rust 代码
cargo check --manifest-path=src-tauri/Cargo.toml
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

