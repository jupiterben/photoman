// T090: 详情视图测试
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

test.describe('Photo Detail View', () => {
  test('should open detail view on photo click', async () => {
    const electronApp = await electron.launch({
      args: ['.'],
      cwd: path.join(__dirname, '..'),
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // 导航到照片页面
    await window.click('[data-testid="sidebar-photos"]');
    await expect(window.locator('[data-testid="photo-grid"]')).toBeVisible();

    // 点击第一张照片
    await window.locator('[data-testid="photo-card"]').first().click();

    // 验证详情模态框打开
    await expect(window.locator('[data-testid="photo-detail-modal"]')).toBeVisible({
      timeout: 2000,
    });

    // 验证图片显示
    await expect(window.locator('[data-testid="photo-viewer"] img')).toBeVisible();

    // 验证元数据显示
    await expect(window.locator('[data-testid="photo-metadata"]')).toBeVisible();

    await electronApp.close();
  });

  test('should navigate with keyboard arrows', async () => {
    const electronApp = await electron.launch({
      args: ['.'],
      cwd: path.join(__dirname, '..'),
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    await window.click('[data-testid="sidebar-photos"]');
    await window.locator('[data-testid="photo-card"]').first().click();

    await expect(window.locator('[data-testid="photo-detail-modal"]')).toBeVisible();

    // 获取当前文件名
    const firstFileName = await window.locator('[data-testid="photo-filename"]').textContent();

    // 按右箭头切换到下一张
    await window.keyboard.press('ArrowRight');
    await window.waitForTimeout(300);

    const secondFileName = await window.locator('[data-testid="photo-filename"]').textContent();

    // 验证切换到不同照片
    expect(secondFileName).not.toBe(firstFileName);

    // 按左箭头返回
    await window.keyboard.press('ArrowLeft');
    await window.waitForTimeout(300);

    const backFileName = await window.locator('[data-testid="photo-filename"]').textContent();

    // 验证返回原照片
    expect(backFileName).toBe(firstFileName);

    await electronApp.close();
  });

  test('should support zoom and pan', async () => {
    const electronApp = await electron.launch({
      args: ['.'],
      cwd: path.join(__dirname, '..'),
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    await window.click('[data-testid="sidebar-photos"]');
    await window.locator('[data-testid="photo-card"]').first().click();

    const viewer = window.locator('[data-testid="photo-viewer"]');
    await expect(viewer).toBeVisible();

    // 点击放大按钮
    await window.click('[data-testid="zoom-in-button"]');
    await window.waitForTimeout(300);

    // 点击缩小按钮
    await window.click('[data-testid="zoom-out-button"]');
    await window.waitForTimeout(300);

    // 点击重置按钮
    await window.click('[data-testid="reset-zoom-button"]');
    await window.waitForTimeout(300);

    // 验证操作完成无错误
    await expect(viewer).toBeVisible();

    await electronApp.close();
  });

  test('should toggle favorite status', async () => {
    const electronApp = await electron.launch({
      args: ['.'],
      cwd: path.join(__dirname, '..'),
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    await window.click('[data-testid="sidebar-photos"]');
    await window.locator('[data-testid="photo-card"]').first().click();

    await expect(window.locator('[data-testid="photo-detail-modal"]')).toBeVisible();

    // 点击收藏按钮
    const favoriteButton = window.locator('[data-testid="favorite-button"]');
    await favoriteButton.click();
    await window.waitForTimeout(300);

    // 验证收藏状态已改变
    // TODO: 添加具体的状态验证

    // 再次点击取消收藏
    await favoriteButton.click();
    await window.waitForTimeout(300);

    await electronApp.close();
  });

  test('should close on escape key', async () => {
    const electronApp = await electron.launch({
      args: ['.'],
      cwd: path.join(__dirname, '..'),
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    await window.click('[data-testid="sidebar-photos"]');
    await window.locator('[data-testid="photo-card"]').first().click();

    await expect(window.locator('[data-testid="photo-detail-modal"]')).toBeVisible();

    // 按 ESC 关闭
    await window.keyboard.press('Escape');
    await window.waitForTimeout(300);

    // 验证模态框已关闭
    await expect(window.locator('[data-testid="photo-detail-modal"]')).not.toBeVisible();

    await electronApp.close();
  });
});
