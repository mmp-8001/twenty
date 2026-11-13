import { expect, test } from '@playwright/test';

import { findReportPageId, logBrowserProblems, setLocale, signIn } from './utils';

let reportPageId: string;

test.beforeAll(async () => {
  reportPageId = await findReportPageId();
});

test.afterAll(async () => {
  await setLocale('en');
});

test.beforeEach(async ({ page }) => {
  logBrowserProblems(page);
  await signIn(page);
});

// The e2e user is the technical admin with no Proopco role, so the page answers with its refusal; the report data itself is covered by the integration suite.
test('the Report page the app ships renders and refuses a member without a Proopco role', async ({ page }) => {
  await page.goto(`/page/${reportPageId}`);
  await expect(page.getByText('You have no access to reports.')).toBeVisible();
});

test('in fa-IR the Report page is translated and reads right to left', async ({ page }) => {
  await setLocale('fa-IR');
  await page.goto(`/page/${reportPageId}`);

  const refusal = page.getByText('به گزارش‌ها دسترسی ندارید.');

  await expect(refusal).toBeVisible();
  expect(await refusal.evaluate((element) => getComputedStyle(element).direction)).toBe('rtl');
});
