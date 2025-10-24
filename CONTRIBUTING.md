# 贡献指南

感谢您对 PhotoMan 项目的关注！本文档将帮助您了解如何为项目做出贡献。

## 开发环境设置

### 必需工具

1. **Rust** (1.75+)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Node.js** (18+)
   ```bash
   # 推荐使用 nvm
   nvm install 18
   nvm use 18
   ```

3. **系统依赖**
   - Windows: Visual Studio Build Tools, WebView2
   - macOS: Xcode Command Line Tools
   - Linux: 参见 [quickstart.md](specs/1-photo-manager/quickstart.md)

### 安装项目依赖

```bash
# 克隆仓库
git clone <repository-url>
cd photoman

# 安装前端依赖
npm install

# 验证Rust环境
cd src-tauri
cargo check
```

## 开发流程

### 1. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/bug-description
```

### 2. 开发

```bash
# 启动开发服务器（前端热重载 + Rust自动编译）
npm run tauri:dev

# 仅前端开发
npm run dev
```

### 3. 代码规范

#### 前端 (TypeScript/React)

```bash
# 运行 ESLint 检查
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix

# 格式化代码
npm run format

# 检查格式
npm run format:check
```

#### 后端 (Rust)

```bash
cd src-tauri

# 运行 Clippy 检查
cargo clippy -- -D warnings

# 格式化代码
cargo fmt

# 检查格式
cargo fmt -- --check
```

### 4. 测试

#### 前端测试

```bash
# 运行单元测试
npm test

# 运行测试并生成覆盖率
npm test -- --coverage
```

#### 后端测试

```bash
cd src-tauri

# 运行所有测试
cargo test

# 运行特定模块测试
cargo test scanner

# 运行测试并显示输出
cargo test -- --nocapture
```

### 5. 提交代码

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 功能
git commit -m "feat: 添加图片导入功能"

# 修复
git commit -m "fix: 修复缩略图缓存问题"

# 文档
git commit -m "docs: 更新 README"

# 样式
git commit -m "style: 格式化代码"

# 重构
git commit -m "refactor: 重构扫描模块"

# 性能
git commit -m "perf: 优化数据库查询"

# 测试
git commit -m "test: 添加标签模块测试"

# 构建
git commit -m "build: 更新依赖版本"
```

### 6. 提交 Pull Request

1. 推送分支到远程仓库
2. 在 GitHub 创建 Pull Request
3. 填写 PR 描述（使用模板）
4. 等待代码审查
5. 根据反馈修改代码
6. 合并后删除分支

## 项目结构

```
photoman/
├── src/                    # 前端源码 (React + TypeScript)
│   ├── components/         # React 组件
│   ├── stores/             # Zustand 状态管理
│   ├── api/                # Tauri API 封装
│   └── i18n/               # 国际化
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── commands/       # Tauri 命令
│   │   ├── database/       # 数据库层
│   │   ├── scanner/        # 扫描模块
│   │   └── main.rs         # 入口
│   └── Cargo.toml          # Rust 依赖
└── specs/                  # 项目规格文档
    └── 1-photo-manager/
        ├── spec.md         # 功能规格
        ├── plan.md         # 实施计划
        └── tasks.md        # 任务清单
```

## 编码规范

### TypeScript/React

1. **组件命名**: PascalCase
   ```tsx
   function PhotoGrid() { ... }
   ```

2. **文件命名**: PascalCase (组件), camelCase (工具/hooks)
   ```
   PhotoGrid.tsx
   usePhotoStore.ts
   formatDate.ts
   ```

3. **使用 TypeScript 严格模式**
   - 避免使用 `any`
   - 为 props 定义接口

4. **React Hooks 规则**
   - 遵循 Hooks 规则
   - 自定义 Hooks 以 `use` 开头

### Rust

1. **命名规范**
   ```rust
   // 函数和变量: snake_case
   fn calculate_hash(file_path: &str) -> String { ... }

   // 类型和 Traits: PascalCase
   struct PhotoMetadata { ... }
   trait DatabaseAccess { ... }

   // 常量: SCREAMING_SNAKE_CASE
   const MAX_CACHE_SIZE: usize = 5_000_000_000;
   ```

2. **错误处理**
   - 使用 `Result<T, E>`
   - 提供有意义的错误信息
   ```rust
   fn scan_folder(path: &str) -> Result<Vec<Photo>, String> {
       // ...
   }
   ```

3. **文档注释**
   ```rust
   /// 扫描指定文件夹中的图片文件
   ///
   /// # Arguments
   /// * `path` - 要扫描的文件夹路径
   ///
   /// # Returns
   /// * `Result<Vec<Photo>, String>` - 成功返回图片列表，失败返回错误信息
   pub fn scan_folder(path: &str) -> Result<Vec<Photo>, String> {
       // ...
   }
   ```

## 常见问题

### 1. Rust 编译错误

**问题**: 缺少系统依赖

**解决**: 参考 [quickstart.md](specs/1-photo-manager/quickstart.md) 安装系统依赖

### 2. 前端无法连接后端

**问题**: Tauri 命令调用失败

**解决**: 确保命令在 `main.rs` 的 `generate_handler![]` 中注册

### 3. 开发服务器启动失败

**问题**: 端口被占用

**解决**: 修改 `vite.config.ts` 中的端口号

## 获取帮助

- 📖 查看 [项目文档](specs/1-photo-manager/)
- 🐛 [提交 Issue](issues)
- 💬 [讨论区](discussions)

## 行为准则

- 尊重所有贡献者
- 提供建设性反馈
- 专注于技术讨论
- 遵守项目宪章原则

感谢您的贡献！🎉

