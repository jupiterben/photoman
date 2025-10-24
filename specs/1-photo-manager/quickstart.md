# PhotoMan - 快速开始指南

## 环境准备

### 必需工具

1. **Rust** (1.75+)
   ```bash
   # 安装rustup（Rust工具链管理器）
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # 验证安装
   rustc --version
   cargo --version
   ```

2. **Node.js** (18+)
   ```bash
   # 推荐使用nvm安装
   nvm install 18
   nvm use 18
   
   # 验证
   node --version
   npm --version
   ```

3. **系统依赖**
   
   **Windows**:
   - Visual Studio Build Tools 2019+
   - WebView2 Runtime（Windows 10/11通常已预装）
   
   **macOS**:
   ```bash
   xcode-select --install
   ```
   
   **Linux (Ubuntu/Debian)**:
   ```bash
   sudo apt update
   sudo apt install -y libwebkit2gtk-4.0-dev \
       build-essential \
       curl \
       wget \
       file \
       libssl-dev \
       libgtk-3-dev \
       libayatana-appindicator3-dev \
       librsvg2-dev
   ```

## 项目初始化

### 1. 创建Tauri项目

```bash
# 使用create-tauri-app创建项目
npm create tauri-app@latest

# 选择以下选项:
# ? Project name: photoman
# ? Choose which language to use for your frontend: TypeScript / JavaScript
# ? Choose your package manager: npm
# ? Choose your UI template: React
# ? Choose your UI flavor: TypeScript
```

### 2. 项目结构

```
photoman/
├── src/                    # 前端代码（React + TypeScript）
│   ├── components/         # React组件
│   ├── hooks/              # 自定义Hooks
│   ├── stores/             # Zustand状态管理
│   ├── utils/              # 工具函数
│   ├── App.tsx             # 主应用组件
│   └── main.tsx            # 入口文件
├── src-tauri/              # Rust后端代码
│   ├── src/
│   │   ├── commands/       # Tauri命令
│   │   ├── database/       # 数据库层
│   │   ├── scanner/        # 扫描模块
│   │   ├── thumbnail/      # 缩略图生成
│   │   ├── exif/           # EXIF解析
│   │   └── main.rs         # Rust入口
│   ├── Cargo.toml          # Rust依赖
│   └── tauri.conf.json     # Tauri配置
├── package.json            # 前端依赖
└── README.md
```

### 3. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装开发依赖
npm install -D @tauri-apps/cli
```

### 4. 配置Cargo.toml

编辑 `src-tauri/Cargo.toml`：

```toml
[package]
name = "photoman"
version = "1.0.0"
description = "本地图片管理应用"
authors = ["PhotoMan Team"]
edition = "2021"

[dependencies]
tauri = { version = "2.0", features = [] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rusqlite = { version = "0.30", features = ["bundled"] }
image = "0.24"
kamadak-exif = "0.5"
notify = "6.1"
tokio = { version = "1.35", features = ["full"] }
sha2 = "0.10"
walkdir = "2.4"
chrono = { version = "0.4", features = ["serde"] }

[build-dependencies]
tauri-build = { version = "2.0", features = [] }
```

### 5. 配置package.json

添加必要的依赖：

```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-dialog": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "react-window": "^1.8.0",
    "react-i18next": "^14.0.0",
    "i18next": "^23.7.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

## 开发第一个功能

### 1. 创建Rust命令

在 `src-tauri/src/commands/mod.rs`：

```rust
use tauri::command;

#[command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to PhotoMan!", name)
}
```

在 `src-tauri/src/main.rs` 注册命令：

```rust
mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::greet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 2. 前端调用

在 `src/App.tsx`：

```typescript
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

function App() {
  const [greeting, setGreeting] = useState('');

  async function handleGreet() {
    const result = await invoke<string>('greet', { name: 'PhotoMan User' });
    setGreeting(result);
  }

  return (
    <div>
      <h1>PhotoMan</h1>
      <button onClick={handleGreet}>Greet</button>
      {greeting && <p>{greeting}</p>}
    </div>
  );
}

export default App;
```

## 运行应用

### 开发模式

```bash
# 启动开发服务器（前端热重载 + Rust编译）
npm run tauri dev
```

### 构建生产版本

```bash
# 构建优化版本
npm run tauri build

# 构建产物位置:
# Windows: src-tauri/target/release/bundle/
# macOS: src-tauri/target/release/bundle/
# Linux: src-tauri/target/release/bundle/
```

## 核心开发模式

### Tauri命令模式

**定义命令**（Rust）:

```rust
#[command]
pub async fn scan_folder(path: String) -> Result<ScanResult, String> {
    // 业务逻辑
    Ok(ScanResult {
        total_files: 100,
        found_photos: 50,
    })
}

#[derive(serde::Serialize)]
pub struct ScanResult {
    total_files: usize,
    found_photos: usize,
}
```

**调用命令**（TypeScript）:

```typescript
import { invoke } from '@tauri-apps/api/core';

interface ScanResult {
  total_files: number;
  found_photos: number;
}

async function scanFolder(path: string): Promise<ScanResult> {
  return await invoke<ScanResult>('scan_folder', { path });
}
```

### Tauri事件系统

**发送事件**（Rust）:

```rust
use tauri::Manager;

#[command]
pub async fn scan_folder(
    app_handle: tauri::AppHandle,
    path: String
) -> Result<(), String> {
    for i in 0..100 {
        // 发送进度事件
        app_handle.emit_all("scan-progress", i)?;
        // 扫描逻辑...
    }
    Ok(())
}
```

**监听事件**（TypeScript）:

```typescript
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen<number>('scan-progress', (event) => {
  console.log('Progress:', event.payload);
});

// 清理监听器
unlisten();
```

### 状态管理（Tauri State）

**Rust后端状态**:

```rust
use std::sync::Mutex;
use tauri::State;

struct AppState {
    db: Mutex<Database>,
}

#[command]
fn get_photo(
    state: State<AppState>,
    photo_id: i64
) -> Result<Photo, String> {
    let db = state.db.lock().unwrap();
    db.get_photo(photo_id).map_err(|e| e.to_string())
}

fn main() {
    let app_state = AppState {
        db: Mutex::new(Database::new()),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![get_photo])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## 调试技巧

### 前端调试

```bash
# 开发模式会自动打开开发者工具
npm run tauri dev
```

在Chrome DevTools中：
- Console: 查看日志
- Network: 查看网络请求（如果有）
- React DevTools: 查看组件状态

### Rust后端调试

添加日志：

```rust
// 在Cargo.toml添加依赖
[dependencies]
log = "0.4"
env_logger = "0.11"

// 在main.rs初始化
fn main() {
    env_logger::init();
    
    log::info!("Starting PhotoMan");
    // ...
}

// 在代码中使用
log::debug!("Scanning folder: {}", path);
log::error!("Failed to load image: {}", error);
```

运行时设置日志级别：

```bash
# Windows PowerShell
$env:RUST_LOG="debug"; npm run tauri dev

# macOS/Linux
RUST_LOG=debug npm run tauri dev
```

### VSCode配置

安装推荐扩展：
- rust-analyzer
- Tauri
- ES7+ React/Redux/React-Native snippets

`.vscode/settings.json`：

```json
{
  "rust-analyzer.cargo.features": "all",
  "rust-analyzer.checkOnSave.command": "clippy"
}
```

## 测试

### 前端测试

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom

# 运行测试
npm test
```

### Rust测试

```bash
cd src-tauri
cargo test
```

测试示例：

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_hash() {
        let hash = calculate_file_hash("/path/to/test.jpg");
        assert_eq!(hash.len(), 64);
    }
}
```

## 常见问题

### 1. Rust编译错误

**问题**: 缺少系统依赖
**解决**: 查看上面的"系统依赖"章节，安装所需工具

### 2. 命令调用失败

**问题**: `invoke` 返回错误
**解决**: 检查命令名称是否在 `generate_handler![]` 中注册

### 3. 前端无法连接后端

**问题**: 开发模式下前端和后端无法通信
**解决**: 确保 `tauri.conf.json` 中的 `devPath` 配置正确

### 4. 打包失败

**问题**: Windows上打包失败
**解决**: 确保安装了Visual Studio Build Tools

## 下一步

1. 阅读 [plan.md](./plan.md) 了解完整开发计划
2. 阅读 [data-model.md](./data-model.md) 了解数据模型设计
3. 参考 [research.md](./research.md) 了解技术选型理由
4. 开始实施 M0: 项目搭建与架构

## 有用的资源

- [Tauri官方文档](https://tauri.app/)
- [Rust编程语言书](https://doc.rust-lang.org/book/)
- [React官方文档](https://react.dev/)
- [rusqlite文档](https://docs.rs/rusqlite/)
- [Tauri命令示例](https://github.com/tauri-apps/tauri/tree/dev/examples)

