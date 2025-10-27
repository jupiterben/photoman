// T088: 导入流程端到端测试
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

test.describe('Photo Import Flow', () => {
  test.beforeEach(async () => {
    // 每个测试前清理数据库
    // TODO: 添加数据库清理逻辑
  });

  test('should complete full import workflow', async () => {
    // 启动 Tauri 应用
    const electronApp = await electron.launch({
      args: ['.'],
      cwd: path.join(__dirname, '..'),
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 1. 点击导入按钮
    await window.click('[data-testid="import-button"]');

    // 2. 选择文件夹（模拟）
    // 注意：实际文件夹选择需要特殊处理
    // TODO: 实现文件夹选择模拟

    // 3. 等待扫描进度条出现
    await expect(window.locator('[data-testid="scan-progress"]')).toBeVisible({
      timeout: 5000,
    });

    // 4. 等待扫描完成
    await expect(window.locator('[data-testid="scan-completed"]')).toBeVisible({
      timeout: 30000,
    });

    // 5. 验证扫描结果摘要
    const summary = window.locator('[data-testid="scan-summary"]');
    await expect(summary).toContainText('找到');
    await expect(summary).toContainText('张照片');

    // 6. 进入照片网格视图
    await window.click('[data-testid="view-photos-button"]');

    // 7. 验证照片已加载
    await expect(window.locator('[data-testid="photo-card"]').first()).toBeVisible({
      timeout: 5000,
    });

    // 8. 验证照片数量
    const photoCards = await window.locator('[data-testid="photo-card"]').count();
    expect(photoCards).toBeGreaterThan(0);

    await electronApp.close();
  });

  test('should handle duplicate detection', async () => {
    // TODO: 测试重复文件检测功能
  });

  test('should show progress updates during scan', async () => {
    // TODO: 测试扫描进度更新
  });

  test('should handle scan errors gracefully', async () => {
    // TODO: 测试扫描错误处理
  });
});
