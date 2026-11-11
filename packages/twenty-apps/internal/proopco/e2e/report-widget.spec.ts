import { expect, test } from '@playwright/test';

import { createReportDashboard, logBrowserProblems, removeReportDashboard, setLocale, signIn } from './utils';

let dashboard: Awaited<ReturnType<typeof createReportDashboard>>;

test.beforeAll(async () => {
  dashboard = await createReportDashboard();
});

test.afterAll(async () => {
  await setLocale('en');
  await removeReportDashboard(dashboard);
});

test.beforeEach(async ({ page }) => {
  logBrowserProblems(page);
  await signIn(page);
});

test('the Report widget renders its period bar on a dashboard', async ({ page }) => {
  await page.goto(`/object/dashboard/${dashboard.dashboardId}`);
  await expect(page.getByRole('button', { name: 'Month' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'All time' })).toBeVisible();
});

test('in fa-IR the Report widget and the Log call form read right to left', async ({ page }) => {
  await setLocale('fa-IR');
  await page.goto(`/object/dashboard/${dashboard.dashboardId}`);

  const month = page.getByRole('button', { name: 'ماه' });

  await expect(month).toBeVisible();
  expect(await month.evaluate((element) => getComputedStyle(element).direction)).toBe('rtl');
});
