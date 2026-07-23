import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for PhotoMan E2E tests (Electron mode).
 * Each test launches its own Electron app via the `_electron` fixture,
 * so we do NOT start a separate web server here.
 */
export default defineConfig({
  testDir: './e2e',
  testIgnore: ['**/fixtures/**'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI
    ? [['list'], ['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
