# API

Tauri 命令调用封装

## 结构

- `tauri.ts` - Tauri API 基础封装 ✅
  - 错误处理（PhotoManError）
  - 数据库 API
  - 通用命令
- `photos.ts` - 图片相关API（待实现）
- `tags.ts` - 标签相关API（待实现）
- `scanner.ts` - 扫描相关API（待实现）

## 使用示例

```typescript
import { getDatabaseInfo, greet, PhotoManError } from '@/api/tauri';

// 获取数据库信息
try {
  const info = await getDatabaseInfo();
  console.log('数据库版本:', info.schema_version);
} catch (error) {
  if (error instanceof PhotoManError) {
    console.error(`错误 ${error.code}: ${error.message}`);
  }
}

// 测试命令
const message = await greet('用户');
console.log(message);
```

## 错误处理

所有 API 函数在失败时抛出 `PhotoManError`，包含：
- `code`: 后端错误代码
- `message`: 可读的错误消息
- `details`: 可选的额外详情

