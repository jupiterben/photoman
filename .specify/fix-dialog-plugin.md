# Tauri Dialog 插件修复

**日期**: 2025-10-27  
**问题**: dialog.open not allowed. Plugin not found  
**状态**: ✅ 已修复

## 问题描述

用户点击导入按钮时遇到两个错误：

### 错误 1: Plugin not found

```
Failed to select folder: dialog.open not allowed. Plugin not found
```

**原因**: Tauri 2.0 的 dialog 插件需要在 Rust 端注册。

### 错误 2: PluginInitialization (已修复)

```
error while running tauri application: PluginInitialization("dialog",
"Error deserializing 'plugins.dialog' within your Tauri configuration:
invalid type: map, expected unit")
```

**原因**: Tauri 2.0 使用 **capabilities** 系统管理权限，不再使用 `plugins` 配置对象。

### 错误 3: Event listener not allowed (已修复)

```
event.listen not allowed. Permissions associated with this command:
core:event:allow-listen, core:event:default
```

**原因**: 扫描进度监听需要 `core:event:allow-listen` 权限，用于接收后端发送的进度事件。

## 修复方案

### 1. 添加 Cargo 依赖

**文件**: `src-tauri/Cargo.toml`

```toml
[dependencies]
tauri = { version = "2.0", features = [] }
tauri-plugin-dialog = "2.0"        # ← 新增
tauri-plugin-fs = "2.0"            # ← 新增
serde = { version = "1.0", features = ["derive"] }
# ... 其他依赖
```

### 2. 注册插件

**文件**: `src-tauri/src/main.rs`

```rust
fn main() {
    env_logger::init();
    log::info!("Starting PhotoMan application");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())   // ← 新增
        .plugin(tauri_plugin_fs::init())       // ← 新增
        .setup(|app| {
            // ... 现有代码
        })
        // ...
}
```

### 3. 配置插件权限 (Tauri 2.0 Capabilities 系统)

**文件**: `src-tauri/tauri.conf.json`

```json
{
  // ... 现有配置
  "app": {
    "security": {
      "csp": null,
      "capabilities": [
        {
          "identifier": "main-capability",
          "description": "Main window capabilities",
          "windows": ["main"],
          "permissions": [
            "dialog:allow-open",
            "dialog:allow-save",
            "dialog:allow-message",
            "dialog:allow-ask",
            "dialog:allow-confirm",
            "fs:allow-read",
            "fs:allow-write",
            "fs:allow-exists",
            "fs:allow-read-dir"
          ]
        }
      ]
    }
  }
}
```

**重要**: Tauri 2.0 使用新的 **capabilities** 系统，而不是直接配置 `plugins` 对象。

## 技术说明

### Tauri 2.0 插件系统

Tauri 2.0 采用新的插件架构，需要三步配置：

1. **Rust 依赖**: 在 `Cargo.toml` 中添加插件 crate
2. **插件注册**: 在 `main.rs` 中调用 `plugin(...)` 注册
3. **权限配置**: 在 `tauri.conf.json` 中授予具体权限

### Tauri 2.0 Capabilities 权限系统

**Core Event 权限** ✅ 必需:

- `core:event:allow-listen`: 允许监听事件 ✅ 扫描进度监听必需
- `core:event:allow-unlisten`: 允许取消监听 ✅ 扫描完成后清理必需
- `core:event:allow-emit`: 允许发送事件 ✅ 后端进度通知必需

**Dialog 权限**:

- `dialog:allow-open`: 允许打开文件/文件夹选择对话框 ✅ 导入功能必需
- `dialog:allow-save`: 允许保存文件对话框
- `dialog:allow-message`: 允许消息提示框
- `dialog:allow-ask`: 允许询问对话框
- `dialog:allow-confirm`: 允许确认对话框

**FS 权限**:

- `fs:allow-read`: 允许读取文件
- `fs:allow-write`: 允许写入文件
- `fs:allow-exists`: 允许检查文件是否存在
- `fs:allow-read-dir`: 允许读取目录内容

**Capabilities 结构**:

- `identifier`: 能力标识符（唯一）
- `description`: 能力描述
- `windows`: 应用该能力的窗口列表
- `permissions`: 具体权限列表

## 验证步骤

1. **停止当前运行的应用**（如果有）
2. **重新构建 Rust 端**:
   ```bash
   cd src-tauri
   cargo build
   ```
3. **重新启动应用**:
   ```bash
   npm run tauri dev
   ```
4. **测试导入功能**:
   - 点击工具栏的"导入图片"按钮
   - 应该直接弹出系统文件夹选择对话框
   - 选择文件夹后开始扫描

## 常见问题

### Q: 为什么需要 fs 插件？

A: 虽然当前只使用 dialog，但扫描功能可能需要读取文件系统信息。提前配置 fs 插件可避免后续问题。

### Q: 权限配置太宽松？

A: 当前配置包含了常用权限。生产环境可根据实际需求精简：

```json
"permissions": [
  "dialog:allow-open",   // 导入功能必需
  "fs:allow-read",       // 读取文件必需
  "fs:allow-read-dir"    // 扫描目录必需
]
```

### Q: 如何添加更多权限？

A: 在 `permissions` 数组中添加：

```json
"permissions": [
  "dialog:allow-open",
  "shell:allow-execute",     // 执行系统命令
  "notification:default"     // 系统通知
]
```

### Q: 为什么是 capabilities 而不是 plugins 配置？

A: Tauri 2.0 引入了新的 **capabilities** 系统，提供更细粒度的权限控制。这是向后不兼容的重大变更。

## 相关文档

- [Tauri 2.0 Capabilities System](https://v2.tauri.app/concept/security/)
- [Tauri Plugin System](https://tauri.app/v2/plugin/)
- [Dialog Plugin API](https://tauri.app/v2/plugin/dialog)
- [FS Plugin API](https://tauri.app/v2/plugin/fs)
- [Security Configuration](https://tauri.app/v2/references/config/#security)

## 关键更新 (2025-10-27)

### Tauri 2.0 配置格式变更

**旧格式 (错误)**:

```json
{
  "plugins": {
    "dialog": { "all": true }
  }
}
```

**新格式 (正确)**:

```json
{
  "app": {
    "security": {
      "capabilities": [
        {
          "identifier": "main-capability",
          "windows": ["main"],
          "permissions": [
            "core:event:allow-listen",
            "core:event:allow-emit",
            "dialog:allow-open",
            "fs:allow-read",
            "fs:allow-read-dir"
          ]
        }
      ]
    }
  }
}
```

### 迁移要点

1. **移除** `plugins` 顶级配置
2. **添加** `app.security.capabilities` 配置
3. **添加** 事件权限 `core:event:allow-listen` 和 `core:event:allow-emit`
4. **使用** 细粒度权限如 `dialog:allow-open`
5. **指定** 窗口范围 `windows: ["main"]`

### 完整权限列表（导入功能）

扫描和导入功能需要的最小权限集：

```json
"permissions": [
  "core:event:allow-listen",    // ✅ 监听扫描进度事件
  "core:event:allow-unlisten",  // ✅ 扫描完成后取消监听
  "core:event:allow-emit",      // ✅ 后端发送进度事件
  "dialog:allow-open",          // ✅ 打开文件夹选择对话框
  "fs:allow-read",              // ✅ 读取文件信息
  "fs:allow-read-dir"           // ✅ 读取目录内容
]
```

### 常见 Warning (非阻塞)

```
Warning: [antd: message] Static function can not consume context like dynamic theme
```

**说明**: 这是 Ant Design 的提示，建议使用 App 组件提供的 message API 而不是静态方法。不影响功能，可后续优化。

---

**修复完成！** 🎉  
现在重新启动应用即可使用导入功能。
