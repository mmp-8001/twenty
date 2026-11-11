import { defineConfig, devices } from '@playwright/test';

// Jalali dates in the specs are Tehran dates; WebKit on Linux ignores timezoneId, so the zone is pinned for the process.
process.env.TZ = 'Asia/Tehran';

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: process.env.FRONT_BASE_URL ?? 'http://apple.localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
    testIdAttribute: 'data-testid',
    timezoneId: 'Asia/Tehran',
  },
  expect: { timeout: 20_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
