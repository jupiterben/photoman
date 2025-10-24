import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for PhotoMan E2E tests
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:11420',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run dev server before starting tests
  webServer: {
    command: 'npm run tauri:dev',
    url: 'http://127.0.0.1:11420',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for Tauri app to start
  },
});
