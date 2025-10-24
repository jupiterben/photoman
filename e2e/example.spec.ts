import { test, expect } from '@playwright/test';

test.describe('PhotoMan Basic Tests', () => {
  test('应用应该正常启动', async ({ page }) => {
    await page.goto('/');

    // 检查页面标题
    await expect(page.locator('h1')).toContainText('PhotoMan');
  });

  test('应该显示描述文本', async ({ page }) => {
    await page.goto('/');

    // 检查描述
    await expect(page.locator('.app')).toContainText('本地图片管理应用');
  });

  test('主题切换按钮应该工作', async ({ page }) => {
    await page.goto('/');

    // 查找切换按钮
    const themeButton = page.locator('button', { hasText: '切换' });
    await expect(themeButton).toBeVisible();

    // 点击切换主题
    await themeButton.click();
  });
});

// 更多端到端测试将在后续阶段添加

