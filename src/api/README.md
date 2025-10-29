# Photos API 使用说明

本文件包含照片管理相关的 API 函数。

## API 函数

### `getPhotos(limit?, offset?): Promise<Photo[]>`
获取照片列表，支持分页。

**参数:**
- `limit` (可选): 返回的最大照片数量
- `offset` (可选): 跳过的照片数量

**示例:**
```typescript
import { getPhotos } from '@/api/photos';

// 获取前 20 张照片
const photos = await getPhotos(20, 0);

// 获取所有照片
const allPhotos = await getPhotos();
```

### `getPhotoById(id: number): Promise<Photo | null>`
根据 ID 获取单张照片的详细信息。

**参数:**
- `id`: 照片 ID

**返回:**
- 找到照片时返回 `Photo` 对象
- 未找到时返回 `null`

**示例:**
```typescript
import { getPhotoById } from '@/api/photos';

const photo = await getPhotoById(123);
if (photo) {
  console.log(photo.file_name);
}
```

### `updatePhoto(request: UpdatePhotoRequest): Promise<void>`
更新照片信息（仅支持元数据更新）。

**参数:**
- `request`: 更新请求对象
  - `id`: 照片 ID (必需)
  - `title`: 标题 (可选)
  - `description`: 描述 (可选)
  - `rating`: 评分 0-5 (可选)
  - `is_favorite`: 是否收藏 (可选)

**示例:**
```typescript
import { updatePhoto } from '@/api/photos';

await updatePhoto({
  id: 123,
  title: '美丽的日落',
  rating: 5,
  is_favorite: true
});
```

### `deletePhoto(id: number): Promise<void>`
删除照片（软删除，可恢复）。

**参数:**
- `id`: 照片 ID

**示例:**
```typescript
import { deletePhoto } from '@/api/photos';

await deletePhoto(123);
```

### `getPhotosCount(includeDeleted?: boolean): Promise<number>`
获取照片总数。

**参数:**
- `includeDeleted` (可选): 是否包含已删除的照片，默认 `false`

**示例:**
```typescript
import { getPhotosCount } from '@/api/photos';

// 获取未删除的照片数量
const count = await getPhotosCount();

// 获取所有照片数量（包括已删除）
const totalCount = await getPhotosCount(true);
```

## Photo 接口

```typescript
interface Photo {
  id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  width?: number;
  height?: number;
  format: string;
  title?: string;
  description?: string;
  rating: number;          // 0-5
  taken_at?: string;       // ISO 8601 格式
  is_favorite: boolean;
  created_at: string;      // ISO 8601 格式
  updated_at: string;      // ISO 8601 格式
}
```

## 错误处理

所有 API 函数都可能抛出错误。建议使用 try-catch 处理：

```typescript
import { getPhotos } from '@/api/photos';

try {
  const photos = await getPhotos(20, 0);
  console.log(`成功加载 ${photos.length} 张照片`);
} catch (error) {
  console.error('加载照片失败:', error);
}
```

## 注意事项

1. 所有 API 调用都是异步的，需要使用 `await` 或 `.then()`
2. `deletePhoto` 是软删除，照片会移到回收站，可通过回收站 API 恢复
3. `rating` 字段的有效范围是 0-5，超出范围会导致错误
4. 更新照片时，只有提供的字段会被更新，未提供的字段保持不变
