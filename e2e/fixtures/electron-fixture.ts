import { test as base, _electron, type ElectronApplication, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
export const PROJECT_ROOT = path.resolve(__dirname, '..');

type ElectronFixtures = {
  electronApp: ElectronApplication;
  window: Page;
};

export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    const app = await _electron.launch({
      args: ['.'],
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
      timeout: 30_000,
    });
    await use(app);
    await app.close().catch(() => {});
  },

  window: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await use(page);
  },
});

export { expect } from '@playwright/test';

export async function navigateToPhotos(window: Page): Promise<void> {
  await window.locator('[data-testid="sidebar-photos"]').click();
  await expect(window.locator('[data-testid="photo-grid"]')).toBeVisible();
}

export async function openFirstPhotoDetail(window: Page): Promise<void> {
  await window.locator('[data-testid="photo-card"]').first().click();
  await expect(window.locator('[data-testid="photo-detail-modal"]')).toBeVisible();
}
