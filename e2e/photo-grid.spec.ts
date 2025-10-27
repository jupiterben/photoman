// T089: 网格视图性能测试
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

test.describe('Photo Grid Performance', () => {
  test('should handle large photo collections efficiently', async () => {
    const electronApp = await electron.launch({
      args: ['.'],
      cwd: path.join(__dirname, '..'),
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 导航到照片页面
    await window.click('[data-testid="sidebar-photos"]');

    // 等待网格加载
    await expect(window.locator('[data-testid="photo-grid"]')).toBeVisible({
      timeout: 5000,
    });

    // 性能测试：滚动
    const startTime = Date.now();

    // 快速滚动到底部
    for (let i = 0; i < 10; i++) {
      await window.keyboard.press('PageDown');
      await window.waitForTimeout(100);
    }

    // 滚动回顶部
    for (let i = 0; i < 10; i++) {
      await window.keyboard.press('PageUp');
      await window.waitForTimeout(100);
    }

    const scrollDuration = Date.now() - startTime;

    // 验证滚动流畅（不超过5秒）
    expect(scrollDuration).toBeLessThan(5000);

    // 验证虚拟滚动正常工作
    const visibleCards = await window.locator('[data-testid="photo-card"]:visible').count();

    // 虚拟滚动应该只渲染可见区域的卡片
    expect(visibleCards).toBeLessThan(100);

    await electronApp.close();
  });

  test('should load thumbnails progressively', async () => {
    const electronApp = await electron.launch({
      args: ['.'],
      cwd: path.join(__dirname, '..'),
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    await window.click('[data-testid="sidebar-photos"]');

    // 等待第一批缩略图加载
    await expect(window.locator('[data-testid="photo-card"] img').first()).toHaveAttribute(
      'src',
      /.+/,
      { timeout: 5000 }
    );

    // 验证懒加载：滚动时才加载更多
    const initialLoadedCount = await window.locator('[data-testid="photo-card"] img[src]').count();

    // 滚动
    await window.keyboard.press('PageDown');
    await window.waitForTimeout(500);

    const afterScrollCount = await window.locator('[data-testid="photo-card"] img[src]').count();

    // 滚动后应该加载更多缩略图
    expect(afterScrollCount).toBeGreaterThan(initialLoadedCount);

    await electronApp.close();
  });

  test('should support different thumbnail sizes', async () => {
    const electronApp = await electron.launch({
      args: ['.'],
      cwd: path.join(__dirname, '..'),
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    await window.click('[data-testid="sidebar-photos"]');
    await expect(window.locator('[data-testid="photo-grid"]')).toBeVisible();

    // 测试小尺寸
    await window.click('[data-testid="thumbnail-size-small"]');
    await window.waitForTimeout(300);

    const smallCard = window.locator('[data-testid="photo-card"]').first();
    const smallSize = await smallCard.boundingBox();

    // 测试中等尺寸
    await window.click('[data-testid="thumbnail-size-medium"]');
    await window.waitForTimeout(300);

    const mediumSize = await smallCard.boundingBox();

    // 测试大尺寸
    await window.click('[data-testid="thumbnail-size-large"]');
    await window.waitForTimeout(300);

    const largeSize = await smallCard.boundingBox();

    // 验证尺寸递增
    expect(mediumSize?.width).toBeGreaterThan(smallSize?.width || 0);
    expect(largeSize?.width).toBeGreaterThan(mediumSize?.width || 0);

    await electronApp.close();
  });
});
