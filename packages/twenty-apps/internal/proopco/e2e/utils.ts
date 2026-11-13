import { type Page } from '@playwright/test';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { metadataRequest } from '../src/__tests__/metadata-request';
import { listMembers } from '../src/__tests__/fixtures';
import { E2E_USER_EMAIL } from './scene';

// The front components render in a worker, so their failures never reach assertions: log them.
export const logBrowserProblems = (page: Page) => {
  page.on('console', (message) => console.log(`[browser:${message.type()}] ${message.text()}`));
  page.on('pageerror', (error) => console.log(`[pageerror] ${error.message}`));
  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.log(`[response ${response.status()}] ${response.request().method()} ${response.url()}`);
    }
  });
};

export const signIn = async (page: Page) => {
  await page.goto('/welcome');
  await page.getByRole('button', { name: 'Continue with Email' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/welcome'), { timeout: 60_000 });
};

export const setLocale = async (locale: string) => {
  const client = new CoreApiClient();
  const memberId = (await listMembers(client)).find(({ userEmail }) => userEmail === E2E_USER_EMAIL)!.id;

  await client.mutation({ updateWorkspaceMember: { __args: { id: memberId, data: { locale } }, id: true } } as never);
};

// The app ships the Report as a standalone page; the test variant gives it its own id, so it is looked up by name.
export const findReportPageId = async () => {
  const { getPageLayouts } = await metadataRequest<{ getPageLayouts: { id: string; name: string }[] }>(
    '{ getPageLayouts(pageLayoutType: STANDALONE_PAGE) { id name } }',
  );

  return getPageLayouts.find(({ name }) => name === 'Report')!.id;
};
