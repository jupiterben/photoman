# Tauri 2.0 权限配置完整指南

**日期**: 2025-10-27  
**项目**: PhotoMan 导入功能  
**状态**: ✅ 全部修复完成

## 问题历程

在实现导入功能时遇到的权限错误及解决方案：

### 错误 1: Plugin not found ✅
```
Failed to select folder: dialog.open not allowed. Plugin not found
```
**解决**: 在 `Cargo.toml` 添加插件依赖，在 `main.rs` 注册插件

### 错误 2: PluginInitialization ✅
```
PluginInitialization("dialog", "invalid type: map, expected unit")
```
**解决**: 移除 `plugins` 配置，使用 Tauri 2.0 的 `capabilities` 系统

### 错误 3: event.listen not allowed ✅
```
event.listen not allowed. Permissions: core:event:allow-listen
```
**解决**: 添加 `core:event:allow-listen` 权限

### 错误 4: event.unlisten not allowed ✅
```
event.unlisten not allowed. Permissions: core:event:allow-unlisten
```
**解决**: 添加 `core:event:allow-unlisten` 权限

## 最终配置

### 1. Cargo.toml
```toml
[dependencies]
tauri = { version = "2.0", features = [] }
tauri-plugin-dialog = "2.0"
tauri-plugin-fs = "2.0"
# ... 其他依赖
```

### 2. main.rs
```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // ...
        })
        // ...
}
```

### 3. tauri.conf.json (完整配置)
```json
{
  "app": {
    "security": {
      "csp": null,
      "capabilities": [
        {
          "identifier": "main-capability",
          "description": "Main window capabilities",
          "windows": ["main"],
          "permissions": [
            "core:event:allow-listen",
            "core:event:allow-unlisten",
            "core:event:allow-emit",
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

## 权限说明

### Core Event 权限（事件系统）
| 权限 | 用途 | 导入功能 |
|------|------|----------|
| `core:event:allow-listen` | 监听后端事件 | ✅ 必需 |
| `core:event:allow-unlisten` | 取消事件监听 | ✅ 必需 |
| `core:event:allow-emit` | 发送事件（后端使用） | ✅ 必需 |

### Dialog 权限（对话框）
| 权限 | 用途 | 导入功能 |
|------|------|----------|
| `dialog:allow-open` | 文件/文件夹选择 | ✅ 必需 |
| `dialog:allow-save` | 保存文件对话框 | ⚪ 可选 |
| `dialog:allow-message` | 消息提示框 | ⚪ 可选 |
| `dialog:allow-ask` | 询问对话框 | ⚪ 可选 |
| `dialog:allow-confirm` | 确认对话框 | ⚪ 可选 |

### FS 权限（文件系统）
| 权限 | 用途 | 导入功能 |
|------|------|----------|
| `fs:allow-read` | 读取文件内容 | ✅ 必需 |
| `fs:allow-read-dir` | 读取目录内容 | ✅ 必需 |
| `fs:allow-write` | 写入文件 | ⚪ 可选 |
| `fs:allow-exists` | 检查文件是否存在 | ⚪ 可选 |

## 最小权限集（仅导入功能）

如果只需要导入功能，可以精简为：

```json
"permissions": [
  "core:event:allow-listen",
  "core:event:allow-unlisten",
  "core:event:allow-emit",
  "dialog:allow-open",
  "fs:allow-read",
  "fs:allow-read-dir"
]
```

## 功能验证清单

- [x] 点击导入按钮
- [x] 系统文件夹选择对话框弹出
- [x] 选择文件夹
- [x] 开始扫描
- [x] 实时显示扫描进度（事件监听）
- [x] 扫描完成
- [x] 自动关闭模态框（取消监听）
- [x] 无权限错误

## Tauri 2.0 vs 1.x

### 配置方式对比

**Tauri 1.x (已废弃)**:
```json
{
  "tauri": {
    "allowlist": {
      "dialog": {
        "all": true,
        "open": true
      }
    }
  }
}
```

**Tauri 2.0 (当前)**:
```json
{
  "app": {
    "security": {
      "capabilities": [{
        "identifier": "main-capability",
        "permissions": ["dialog:allow-open"]
      }]
    }
  }
}
```

### 关键变化

1. **配置位置**: `tauri.allowlist` → `app.security.capabilities`
2. **权限格式**: `{ "all": true }` → `["plugin:allow-action"]`
3. **粒度**: 粗粒度 → 细粒度
4. **窗口范围**: 隐式 → 显式指定

## 调试技巧

### 查看所需权限

当遇到权限错误时，错误消息会提示所需权限：

```
event.listen not allowed. 
Permissions associated with this command: core:event:allow-listen
```

**解决方法**: 将 `core:event:allow-listen` 添加到 `permissions` 数组

### 常见模式

- `plugin:allow-action` - 插件特定操作
- `core:module:allow-action` - 核心模块操作
- `plugin:default` - 插件默认权限集

## 性能考虑

### 权限检查开销

Tauri 2.0 的细粒度权限在运行时检查，但开销极小（纳秒级）。

### 最佳实践

1. **按需添加**: 只添加实际需要的权限
2. **分组管理**: 相关功能使用同一个 capability
3. **文档化**: 注释说明每个权限的用途
4. **定期审计**: 删除不再需要的权限

## 安全建议

### 生产环境

```json
"permissions": [
  // 仅列出实际使用的权限
  "core:event:allow-listen",
  "core:event:allow-unlisten", 
  "dialog:allow-open",
  "fs:allow-read",
  "fs:allow-read-dir"
  // 移除 fs:allow-write（如果不需要）
]
```

### 开发环境

当前配置包含额外权限便于调试，可接受。

## 相关资源

- [Tauri 2.0 Security](https://v2.tauri.app/concept/security/)
- [Capabilities Guide](https://v2.tauri.app/security/capabilities/)
- [Permission Reference](https://v2.tauri.app/reference/config/#permissions)
- [Dialog Plugin](https://v2.tauri.app/plugin/dialog/)
- [FS Plugin](https://v2.tauri.app/plugin/fs/)

## 总结

经过 4 轮权限修复，导入功能现已完全正常工作：

✅ **插件依赖**: Cargo.toml + main.rs  
✅ **配置格式**: capabilities 系统  
✅ **事件权限**: listen + unlisten + emit  
✅ **对话框权限**: open  
✅ **文件系统权限**: read + read-dir  

**总共需要 6 个核心权限**实现完整的导入和进度监听功能。

---

**配置完成！导入功能已完全可用。** 🎉
















