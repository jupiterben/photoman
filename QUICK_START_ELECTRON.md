# 🚀 Electron 版本快速开始指南

> PhotoMan 已完全迁移到 Electron！本指南帮助你快速上手。

---

## ⚡ 3 分钟快速开始

### 1️⃣ 安装 pnpm（如果还没有）

```bash
npm install -g pnpm
```

### 2️⃣ 安装依赖

```bash
# 删除旧的依赖（如果之前用过 Tauri 版本）
rm -rf node_modules

# 安装依赖
pnpm install

# 编译 native 模块
pnpm rebuild
```

### 3️⃣ 启动应用

```bash
pnpm dev:electron
```

🎉 完成！应用应该自动打开窗口。

---

## 📦 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev:electron` | 启动开发模式（推荐） |
| `pnpm build:all` | 构建前端和后端 |
| `pnpm dist:win` | 打包 Windows 安装包 |
| `pnpm lint` | 代码检查 |
| `pnpm format` | 代码格式化 |

---

## 🔧 故障排除

### 问题 1: Native 模块编译失败

**症状**: `better-sqlite3` 或 `sharp` 安装失败

**解决方案 (Windows)**:
```bash
# 安装构建工具
npm install --global windows-build-tools

# 或安装 Visual Studio Build Tools
# 下载: https://visualstudio.microsoft.com/downloads/
```

然后重新运行：
```bash
pnpm install
pnpm rebuild
```

### 问题 2: "exports is not defined" 错误

**症状**: Electron 启动时报错

**解决方案**:
```bash
# 重新构建 Electron 后端
pnpm build:electron
```

确保 `dist-electron/package.json` 存在且内容为：
```json
{
  "type": "commonjs"
}
```

### 问题 3: 端口被占用

**症状**: `Port 5173 is already in use`

**解决方案**:
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <进程ID> /F

# Linux/macOS
lsof -ti:5173 | xargs kill -9
```

### 问题 4: 找不到某个包

**症状**: `Cannot find module '@tauri-apps/...'`

**解决方案**:
Tauri 依赖已完全移除。如果看到此错误，说明代码中还有旧的 import 语句。

检查并更新导入：
```typescript
// ❌ 旧的 Tauri 导入
import { invoke } from '@tauri-apps/api/core';

// ✅ 新的 Electron 导入
import { invoke } from '@/api/tauri-adapter';
```

---

## 📁 项目结构速览

```
photoman/
├── electron/              # Electron 主进程（后端）
│   ├── main.ts           # 入口文件
│   ├── preload.ts        # Preload 脚本
│   ├── services/         # 业务服务
│   ├── ipc/              # IPC 处理器
│   └── types/            # 类型定义
│
├── src/                  # 前端代码
│   ├── api/             # API 层
│   ├── components/      # React 组件
│   ├── stores/          # Zustand 状态
│   └── pages/           # 页面组件
│
├── dist-electron/        # Electron 编译输出
└── dist/                 # 前端编译输出
```

---

## 🎯 开发工作流

### 日常开发

```bash
# 1. 启动开发服务器
pnpm dev:electron

# 2. 修改代码
# - 前端代码修改会自动热重载
# - 后端代码修改需要重启 Electron

# 3. 代码检查和格式化
pnpm lint
pnpm format
```

### 添加新功能

```bash
# 1. 在 electron/services/ 创建新服务
# 2. 在 electron/ipc/ 注册 IPC 命令
# 3. 在 src/api/ 创建前端 API
# 4. 在组件中使用

# 示例：添加新的 IPC 命令
# electron/ipc/my-handlers.ts
registerHandler('my_command', async (args) => {
  return myService.doSomething(args);
});

# src/api/my-api.ts
export async function myCommand(data) {
  return invoke('my_command', data);
}
```

### 发布版本

```bash
# 1. 更新版本号
npm version patch  # 或 minor / major

# 2. 构建全部
pnpm build:all

# 3. 打包
pnpm dist:win   # Windows
pnpm dist:mac   # macOS
pnpm dist:linux # Linux

# 4. 测试安装包
# 在 dist-output/ 目录查找
```

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [PNPM_SETUP.md](./PNPM_SETUP.md) | pnpm 详细配置和使用 |
| [ELECTRON_MIGRATION.md](./ELECTRON_MIGRATION.md) | Electron 迁移完整报告 |
| [TAURI_REMOVAL.md](./TAURI_REMOVAL.md) | Tauri 清理详情 |
| [README.md](./README.md) | 项目完整说明 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 贡献指南 |

---

## 🆘 需要帮助？

1. **查看文档**: 首先查看上面的相关文档
2. **检查日志**: 启动时的 console 输出通常包含有用信息
3. **清理重装**: 尝试删除 `node_modules` 和 `dist-electron`，重新安装
4. **查看 Issues**: 检查项目 Issues 是否有类似问题

---

## ✅ 验证安装

运行以下命令验证安装是否成功：

```bash
# 1. 检查依赖
pnpm list electron better-sqlite3 sharp

# 2. 编译检查
pnpm build:all

# 3. 启动检查
pnpm dev:electron
```

如果以上命令都成功执行，说明环境配置正确！🎉

---

**最后更新**: 2025-10-29  
**适用版本**: PhotoMan 2.0.0 (Electron)

