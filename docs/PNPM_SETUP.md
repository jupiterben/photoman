# pnpm 安装与配置指南

## 📦 安装 pnpm

### Windows

```powershell
# 使用 npm 安装（如果已有 npm）
npm install -g pnpm

# 或使用 standalone script
iwr https://get.pnpm.io/install.ps1 -useb | iex

# 或使用 Scoop
scoop install pnpm

# 或使用 Chocolatey
choco install pnpm
```

### macOS / Linux

```bash
# 使用 npm 安装
npm install -g pnpm

# 或使用 standalone script
curl -fsSL https://get.pnpm.io/install.sh | sh -

# 或使用 Homebrew (macOS)
brew install pnpm
```

### 验证安装

```bash
pnpm --version
```

---

## 🚀 项目设置

### 1. 清理旧的依赖（如果之前使用 npm）

```bash
# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# Windows PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 编译 Native 模块（Electron）

```bash
# 重新编译 better-sqlite3 和 sharp 为 Electron 版本
pnpm rebuild
```

---

## 🔧 开发命令

### 启动开发服务器

```bash
# Vite 开发服务器（前端）
pnpm dev

# Electron 应用（前端 + 后端）
pnpm dev:electron
```

### 构建项目

```bash
# 构建前端
pnpm build

# 构建 Electron 后端
pnpm build:electron

# 构建全部（前端 + 后端）
pnpm build:all
```

### 打包应用

```bash
# Windows 安装包
pnpm dist:win

# macOS 安装包
pnpm dist:mac

# Linux 安装包
pnpm dist:linux
```

---

## 🛠️ 配置说明

### package.json 配置

已添加 `pnpm` 配置字段：

```json
{
  "pnpm": {
    "supportedArchitectures": {
      "os": ["win32", "darwin", "linux"],
      "cpu": ["x64", "arm64"]
    },
    "allowedDeprecatedVersions": {
      "inflight": "*",
      "glob": "*",
      "rimraf": "*"
    },
    "overrides": {
      "electron": "39.0.0"
    },
    "peerDependencyRules": {
      "ignoreMissing": [
        "@electron/rebuild"
      ]
    }
  }
}
```

**说明**:
- `supportedArchitectures`: 支持的平台和 CPU 架构
- `allowedDeprecatedVersions`: 允许使用的废弃包版本
- `overrides`: 强制使用特定版本的包（确保 Electron 版本一致）
- `peerDependencyRules`: peer dependency 规则

### .npmrc 配置

创建了 `.npmrc` 文件用于 pnpm 行为配置：

```ini
# 允许运行脚本（native 模块编译需要）
enable-pre-post-scripts=true

# Electron 镜像（中国大陆加速）
electron_mirror=https://npmmirror.com/mirrors/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/

# 对于 native 模块使用 shamefully-hoist
shamefully-hoist=true

# 允许自动安装 peer dependencies
auto-install-peers=true

# 严格的 peer dependencies
strict-peer-dependencies=false

# Node linker（对于 Electron 推荐使用 hoisted）
node-linker=hoisted
```

**关键配置解释**:
- `enable-pre-post-scripts=true`: 允许运行 install 脚本（better-sqlite3/sharp 需要）
- `shamefully-hoist=true`: 将所有包提升到 node_modules 根目录（Electron 需要）
- `node-linker=hoisted`: 使用提升的 node_modules 结构
- `strict-peer-dependencies=false`: 不严格检查 peer dependencies

---

## 🐛 常见问题

### 1. Native 模块编译失败

**问题**: `better-sqlite3` 或 `sharp` 编译失败

**解决方案**:

```bash
# Windows: 确保安装了构建工具
npm install --global windows-build-tools

# 或使用 Visual Studio Build Tools
# 下载安装: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

# 清理缓存并重新安装
pnpm store prune
rm -rf node_modules
pnpm install
pnpm rebuild
```

### 2. Electron 启动报错 "exports is not defined"

**问题**: 模块系统冲突

**解决方案**:
已通过 `scripts/post-build-electron.cjs` 自动处理，确保运行了：

```bash
pnpm build:electron
```

### 3. pnpm 版本不兼容

**推荐版本**: pnpm >= 8.0.0

```bash
# 更新到最新版本
pnpm add -g pnpm
```

### 4. 镜像源问题（中国大陆）

如果 `.npmrc` 中的镜像源无法访问，可以修改为：

```ini
# 使用淘宝镜像
electron_mirror=https://cdn.npmmirror.com/binaries/electron/
electron_builder_binaries_mirror=https://cdn.npmmirror.com/binaries/electron-builder-binaries/

# 或使用官方源（需要代理）
# electron_mirror=https://github.com/electron/electron/releases/download/
```

---

## 📊 pnpm vs npm 性能对比

| 指标 | pnpm | npm |
|------|------|-----|
| 安装速度 | ⚡️⚡️⚡️ 快 2-3x | ⚡️ 基准 |
| 磁盘空间 | 💾 节省 50-70% | 💾 基准 |
| node_modules 大小 | 📦 小 | 📦 大 |
| 严格性 | ✅ 更严格 | ⚠️ 宽松 |

---

## 🎯 推荐工作流

### 初次设置

```bash
# 1. 安装 pnpm
npm install -g pnpm

# 2. 克隆项目
git clone <repo-url>
cd photoman

# 3. 安装依赖
pnpm install

# 4. 编译 Electron 后端
pnpm build:electron

# 5. 启动开发服务器
pnpm dev:electron
```

### 日常开发

```bash
# 启动开发模式
pnpm dev:electron

# 代码检查
pnpm lint
pnpm format

# 测试
pnpm test
```

### 发布前

```bash
# 1. 构建全部
pnpm build:all

# 2. 打包应用
pnpm dist:win  # 或 dist:mac / dist:linux

# 3. 测试安装包
# 在 dist-output/ 目录查找生成的安装包
```

---

## 🔗 相关资源

- [pnpm 官方文档](https://pnpm.io/)
- [pnpm CLI 命令](https://pnpm.io/cli/install)
- [Electron 官方文档](https://www.electronjs.org/)
- [better-sqlite3 文档](https://github.com/WiseLibs/better-sqlite3)
- [Sharp 文档](https://sharp.pixelplumbing.com/)

---

**最后更新**: 2025-10-29  
**pnpm 版本**: 8.x+  
**Node.js 版本**: 18.x+ or 20.x+

