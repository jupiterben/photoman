# 测试指南

PhotoMan 采用三层测试策略：单元测试、集成测试和端到端测试。

## 测试框架

### 前端测试
- **框架**: Vitest + React Testing Library
- **目的**: 测试 React 组件和 hooks
- **位置**: `src/**/*.test.tsx`

### 后端测试
- **框架**: Cargo test (内置)
- **目的**: 测试 Rust 模块和函数
- **位置**: `src-tauri/src/**/*.rs` (inline) + `src-tauri/tests/**/*.rs` (集成测试)

### 端到端测试
- **框架**: Playwright
- **目的**: 测试完整的用户场景
- **位置**: `e2e/**/*.spec.ts`

## 运行测试

### 前端单元测试

```bash
# 运行所有测试
npm test

# 监听模式（自动重新运行）
npm test -- --watch

# 生成覆盖率报告
npm run test:coverage

# 使用 UI 界面
npm run test:ui
```

### 后端单元测试

```bash
cd src-tauri

# 运行所有测试
cargo test

# 运行特定模块
cargo test scanner

# 显示测试输出
cargo test -- --nocapture

# 运行集成测试
cargo test --test integration
```

### 端到端测试

```bash
# 运行所有 E2E 测试
npm run test:e2e

# 使用 UI 模式
npm run test:e2e:ui

# 调试模式
npm run test:e2e:debug

# 运行特定测试文件
npx playwright test e2e/example.spec.ts
```

## 编写测试

### 前端组件测试示例

```tsx
// src/components/PhotoGrid.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PhotoGrid from './PhotoGrid';

describe('PhotoGrid', () => {
  it('应该渲染空状态', () => {
    render(<PhotoGrid photos={[]} />);
    expect(screen.getByText('暂无图片')).toBeInTheDocument();
  });

  it('应该渲染图片列表', () => {
    const photos = [
      { id: 1, name: 'test1.jpg', path: '/path/to/test1.jpg' },
      { id: 2, name: 'test2.jpg', path: '/path/to/test2.jpg' },
    ];
    render(<PhotoGrid photos={photos} />);
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });
});
```

### Rust 单元测试示例

```rust
// src-tauri/src/scanner/detector.rs
pub fn is_image_file(path: &str) -> bool {
    let ext = Path::new(path)
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("");
    matches!(ext.to_lowercase().as_str(), "jpg" | "jpeg" | "png" | "gif" | "webp")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_image_file() {
        assert!(is_image_file("photo.jpg"));
        assert!(is_image_file("image.PNG"));
        assert!(!is_image_file("document.pdf"));
        assert!(!is_image_file("video.mp4"));
    }
}
```

### 端到端测试示例

```typescript
// e2e/photo-import.spec.ts
import { test, expect } from '@playwright/test';

test.describe('图片导入功能', () => {
  test('应该能够选择文件夹并扫描图片', async ({ page }) => {
    await page.goto('/');

    // 点击导入按钮
    await page.click('button:has-text("导入图片")');

    // 等待文件夹选择器（模拟）
    // 实际测试需要配合 Tauri 的测试工具

    // 验证扫描结果
    await expect(page.locator('.scan-result')).toContainText('扫描完成');
  });
});
```

## 测试覆盖率目标

### Phase 1-2 (基础设施)
- **前端**: 60%+
- **后端**: 70%+

### Phase 3-6 (核心功能)
- **前端**: 75%+
- **后端**: 80%+

### Phase 7 (发布前)
- **前端**: 80%+
- **后端**: 85%+
- **E2E**: 所有核心用户场景

## 测试最佳实践

### 通用原则
1. **测试行为，而非实现**: 关注用户体验，而非内部实现细节
2. **保持测试独立**: 每个测试应该能独立运行
3. **使用描述性名称**: 测试名称应该清晰说明测试内容
4. **避免重复**: 使用 setup/teardown 或工具函数

### 前端测试
1. **使用 Testing Library 查询优先级**:
   - `getByRole` > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByTestId`
2. **测试用户交互**: 使用 `@testing-library/user-event`
3. **模拟 Tauri API**: 使用 `vi.mock()` 模拟后端调用

### Rust 测试
1. **使用 `#[cfg(test)]`**: 确保测试代码不会编译到生产版本
2. **测试边界情况**: 空输入、错误输入、极限值
3. **使用 Result**: 在测试中使用 `Result<(), Error>` 简化错误处理
4. **文档测试**: 在文档注释中包含示例代码

### E2E 测试
1. **测试关键流程**: 重点测试核心用户场景
2. **使用 Page Object 模式**: 封装页面交互逻辑
3. **合理使用等待**: 使用 `waitFor` 而非固定延迟
4. **截图和视频**: 失败时自动保存调试信息

## 持续集成

### GitHub Actions (计划)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
      - run: npm run test:coverage

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: cd src-tauri && cargo test

  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## 调试测试

### Vitest 调试
```bash
# 在浏览器中调试
npm run test:ui

# 使用 VSCode 断点
# 在 .vscode/launch.json 中配置
```

### Rust 测试调试
```bash
# 使用 rust-lldb (macOS/Linux) 或 rust-gdb
rust-lldb target/debug/deps/photoman-<hash>

# 或在 VSCode 中使用 CodeLLDB 扩展
```

### Playwright 调试
```bash
# 步进模式
npm run test:e2e:debug

# 查看测试报告
npx playwright show-report
```

## 常见问题

### Q: 测试超时怎么办？
A: 增加超时时间或检查异步操作是否正确处理

### Q: 如何模拟文件系统操作？
A: 前端使用 `vi.mock()`，Rust 使用临时文件夹

### Q: E2E 测试不稳定怎么办？
A: 使用显式等待，避免硬编码延迟，检查元素可见性

---

更多信息请参考：
- [Vitest 文档](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright 文档](https://playwright.dev/)
- [Rust 测试书](https://doc.rust-lang.org/book/ch11-00-testing.html)

