# 后台扫描服务 (ScanService)

## 概述

`ScanService` 是一个后台扫描服务，负责：
- 自动扫描新添加的监控目录
- 处理文件系统事件（文件创建、修改、删除、重命名）
- 持续运行在后台，实时更新数据库

## 架构

```
┌─────────────────┐
│  前端 UI        │
└────────┬────────┘
         │ Tauri 命令
         ▼
┌─────────────────┐
│ add_watched_    │──┐
│ directory       │  │ 触发初始扫描
└─────────────────┘  │
                     ▼
         ┌─────────────────────┐
         │   ScanService       │
         │  - scan_directory   │
         │  - scan_single_file │
         │  - handle_*         │
         └──────────┬──────────┘
                    │ 更新数据库
                    ▼
         ┌─────────────────────┐
         │      Database       │
         └─────────────────────┘

┌─────────────────┐
│  WatcherManager │──┐
│  事件循环       │  │ 文件系统事件
└─────────────────┘  │
                     ▼
         ┌─────────────────────┐
         │   ScanService       │
         │  处理文件事件       │
         └─────────────────────┘
```

## 主要功能

### 1. 添加监控目录自动扫描

当调用 `add_watched_directory` 时：
```rust
// 1. 添加到数据库
// 2. 添加到 WatcherManager
// 3. 启动后台线程执行初始扫描
thread::spawn(|| {
    scan_service.scan_directory(&path, recursive, Some(&app_handle))
});
```

前端会收到事件：
- `initial_scan_complete` - 扫描完成
- `initial_scan_error` - 扫描失败

### 2. 实时文件监控

WatcherManager 检测到文件系统事件后，调用 ScanService：

| 事件类型 | 处理方法 | 说明 |
|---------|---------|------|
| 创建文件 | `scan_single_file` | 扫描并添加到数据库 |
| 修改文件 | `handle_file_modified` | 更新哈希和文件大小 |
| 删除文件 | `handle_file_deleted` | 软删除（标记为已删除） |
| 重命名文件 | `handle_file_renamed` | 更新路径和文件名 |

### 3. 重新扫描

手动触发重新扫描：
```typescript
await invoke('rescan_watched_directory', { directory_id: 1 });
```

前端会收到事件：
- `rescan_complete` - 重新扫描完成
- `rescan_error` - 重新扫描失败

## 前端监听事件

```typescript
import { listen } from '@tauri-apps/api/event';

// 监听初始扫描完成
await listen('initial_scan_complete', (event) => {
  const { directory_id, directory_path, stats } = event.payload;
  console.log(`目录 ${directory_path} 扫描完成:`, stats);
  // stats: { total_files, added_photos, skipped_duplicates, errors }
});

// 监听初始扫描错误
await listen('initial_scan_error', (event) => {
  const { directory_id, directory_path, error } = event.payload;
  console.error(`目录 ${directory_path} 扫描失败:`, error);
});

// 监听扫描进度
await listen('scan_progress', (event) => {
  const { total_files, added_photos, current_path } = event.payload;
  console.log(`扫描进度: ${added_photos}/${total_files} - ${current_path}`);
});

// 监听文件系统事件
await listen('file-system-event', (event) => {
  const { type, path } = event.payload;
  console.log(`文件事件: ${type} - ${path}`);
  // type: "created", "modified", "deleted", "renamed"
});
```

## ScanService API

### scan_single_file
扫描单个文件并添加到数据库。

```rust
pub fn scan_single_file(&self, file_path: &Path) -> Result<Option<i64>>
```

- 检查是否为图片文件
- 计算文件哈希，避免重复
- 提取图片元数据（格式、尺寸）
- 插入数据库
- 返回照片 ID（如果成功）或 None（重复/非图片）

### scan_directory
递归扫描目录。

```rust
pub fn scan_directory(
    &self,
    dir_path: &Path,
    recursive: bool,
    app_handle: Option<&AppHandle>,
) -> Result<ScanStats>
```

- 遍历目录中的所有文件
- 对每个图片文件调用 `scan_single_file`
- 每 10 个文件发送一次进度事件
- 返回扫描统计信息

### handle_file_deleted
处理文件删除事件（软删除）。

```rust
pub fn handle_file_deleted(&self, file_path: &Path) -> Result<()>
```

### handle_file_modified
处理文件修改事件。

```rust
pub fn handle_file_modified(&self, file_path: &Path) -> Result<()>
```

### handle_file_renamed
处理文件重命名事件。

```rust
pub fn handle_file_renamed(&self, from: &Path, to: &Path) -> Result<()>
```

## 工作流程示例

### 添加监控目录
```
用户点击"添加目录" → 
  调用 add_watched_directory → 
    保存到数据库 → 
    添加到 WatcherManager → 
    启动后台扫描线程 → 
      扫描目录中的所有图片 → 
        发送进度事件 → 
          扫描完成，发送完成事件
```

### 文件系统事件处理
```
用户复制图片到监控目录 → 
  WatcherManager 检测到文件创建事件 → 
    调用 ScanService.scan_single_file → 
      计算哈希，检查重复 → 
        提取元数据 → 
          插入数据库 → 
            发送文件系统事件到前端
```

## 性能优化

1. **后台线程**：扫描在独立线程中运行，不阻塞主线程
2. **增量扫描**：只扫描新文件，不重复处理
3. **哈希去重**：避免重复添加相同文件
4. **批量进度**：每 10 个文件发送一次进度，减少事件开销

## 注意事项

1. 初始扫描在后台线程运行，不会阻塞 UI
2. 文件系统事件处理是实时的
3. 所有数据库操作都使用事务保证一致性
4. 错误会被捕获并记录日志，不会崩溃应用
5. 只处理图片文件（jpg, jpeg, png, gif, bmp, webp, heic, heif, tiff, tif）

## 测试

1. 添加监控目录，观察是否自动扫描
2. 复制图片到监控目录，检查是否自动添加
3. 删除图片，检查是否标记为已删除
4. 重命名图片，检查路径是否更新
5. 修改图片，检查哈希是否更新

