# 导入功能用户体验优化

**日期**: 2025-10-27  
**类型**: UX 优化  
**影响范围**: 导入流程

## 用户需求

用户反馈："无需使用 FolderPicker，直接弹出系统选择"

**需求分析**: 用户希望点击导入按钮时，能直接打开系统文件夹选择对话框，而不是先显示一个中间界面。

## 优化方案

### 架构调整

```
优化前:
Toolbar/Photos 页面
  → ImportModal（显示 FolderPicker 按钮）
    → 点击 FolderPicker 按钮
      → 系统对话框

优化后:
Toolbar/Photos 页面
  → useImportPhotos.startImport()
    → 系统对话框（直接）
    → ImportModal（仅显示进度）
```

### 代码变更

#### 1. 新增 Hook: `src/hooks/useImportPhotos.ts`

**职责**:
- 封装导入逻辑
- 直接调用 Tauri 对话框 API
- 管理扫描流程
- 统一错误处理

**导出**:
```typescript
{
  startImport: (onComplete?) => Promise<boolean>
  isSelecting: boolean
}
```

#### 2. 简化 ImportModal

**改动**:
- 移除 FolderPicker 组件
- 仅保留 ScanProgress
- 根据扫描状态自动显示/隐藏

**Props**:
```typescript
{
  open: boolean  // 由父组件控制
  onClose: () => void
}
```

#### 3. 重构 Toolbar 和 Photos 页面

**改动**:
- 使用 `useImportPhotos` Hook
- 按钮 loading 状态指示选择中
- 模态框根据 `isScanning || scanResult` 显示
- `useEffect` 监听结果自动关闭

## 用户体验改进

### 操作步骤对比

| 步骤 | 优化前 | 优化后 |
|------|--------|--------|
| 1 | 点击导入按钮 | 点击导入按钮 |
| 2 | 显示模态框 | ~~（跳过）~~ |
| 3 | 点击"选择文件夹" | ~~（跳过）~~ |
| 4 | 系统对话框选择 | 系统对话框选择 |
| 5 | 扫描开始 | 扫描开始 |

**结果**: 从 5 步简化到 3 步，减少 40% 操作

### 视觉反馈改进

1. **按钮 Loading**: 选择文件夹时按钮显示 loading 状态
2. **智能模态框**: 仅在扫描时显示，选择时不显示
3. **自动关闭**: 扫描完成 3 秒后自动关闭

## 技术优势

1. **代码复用**: Hook 可在多个组件中使用
2. **关注点分离**: UI 组件和业务逻辑分离
3. **易于测试**: Hook 可独立测试
4. **类型安全**: TypeScript 完整类型定义

## 文件变更总结

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/hooks/useImportPhotos.ts` | 新增 | 导入逻辑 Hook |
| `src/hooks/index.ts` | 新增 | Hooks 导出 |
| `src/components/ImportModal.tsx` | 修改 | 简化为纯进度显示 |
| `src/components/Toolbar.tsx` | 修改 | 使用 Hook 重构 |
| `src/pages/Photos.tsx` | 修改 | 使用 Hook 重构 |

## 测试验证

- [x] Lint 检查通过（无新增错误）
- [x] TypeScript 类型检查通过
- [x] 导入按钮显示 loading 状态
- [x] 直接弹出系统对话框
- [x] 扫描进度正常显示
- [x] 自动关闭功能正常
- [x] 错误处理正常

## 后续建议

1. 添加"记住最后选择的文件夹"功能
2. 支持拖放文件夹到窗口直接导入
3. 添加扫描取消功能
4. 支持批量选择多个文件夹

---

**优化效果**: ⭐⭐⭐⭐⭐  
**实施难度**: ⭐⭐☆☆☆  
**向后兼容**: ✅ 完全兼容

