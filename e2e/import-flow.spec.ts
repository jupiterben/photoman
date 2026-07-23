import { test, expect } from './fixtures/electron-fixture';

test.describe('Photo Import Flow', () => {
  test('should complete full import workflow', async ({ window }) => {
    await window.locator('[data-testid="import-button"]').click();

    await expect(window.locator('[data-testid="scan-progress"]')).toBeVisible({ timeout: 5_000 });
    await expect(window.locator('[data-testid="scan-completed"]')).toBeVisible({ timeout: 30_000 });

    const summary = window.locator('[data-testid="scan-summary"]');
    await expect(summary).toContainText('找到');
    await expect(summary).toContainText('张照片');

    await window.locator('[data-testid="view-photos-button"]').click();

    const firstCard = window.locator('[data-testid="photo-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 5_000 });

    const count = await window.locator('[data-testid="photo-card"]').count();
    expect(count).toBeGreaterThan(0);
  });

  test.skip('should handle duplicate detection', () => {});
  test.skip('should show progress updates during scan', () => {});
  test.skip('should handle scan errors gracefully', () => {});
});
