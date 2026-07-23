import { test, expect } from './fixtures/electron-fixture';

test.describe('PhotoMan 基础烟雾测试', () => {
  test('应用窗口应该正常启动', async ({ window }) => {
    await expect(window).toHaveTitle(/PhotoMan/);
  });

  test('根布局应该渲染', async ({ window }) => {
    await expect(window.locator('#root, .app, [data-testid="app"]').first()).toBeVisible();
  });

  test('主题切换按钮应该可见', async ({ window }) => {
    const themeButton = window.locator('button', { hasText: /切换|theme/i }).first();
    await expect(themeButton).toBeVisible();
  });
});
