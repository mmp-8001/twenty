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

// A Dashboard record whose page layout holds the Report widget, as the runbook builds it by hand.
export const createReportDashboard = async () => {
  const { frontComponents } = await metadataRequest<{ frontComponents: { id: string; name: string }[] }>(
    '{ frontComponents { id name } }',
  );
  const frontComponentId = frontComponents.find(({ name }) => name === 'report')!.id;
  const { createPageLayout } = await metadataRequest<{ createPageLayout: { id: string } }>(
    'mutation ($input: CreatePageLayoutInput!) { createPageLayout(input: $input) { id } }',
    { input: { name: 'E2E Reports', type: 'DASHBOARD' } },
  );
  const { createPageLayoutTab } = await metadataRequest<{ createPageLayoutTab: { id: string } }>(
    'mutation ($input: CreatePageLayoutTabInput!) { createPageLayoutTab(input: $input) { id } }',
    { input: { title: 'Reports', position: 0, pageLayoutId: createPageLayout.id, layoutMode: 'GRID' } },
  );

  await metadataRequest(
    'mutation ($input: CreatePageLayoutWidgetInput!) { createPageLayoutWidget(input: $input) { id } }',
    {
      input: {
        pageLayoutTabId: createPageLayoutTab.id,
        title: 'Report',
        type: 'FRONT_COMPONENT',
        position: { layoutMode: 'GRID', row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
        configuration: { configurationType: 'FRONT_COMPONENT', frontComponentId },
      },
    },
  );

  const client = new CoreApiClient();
  const { createDashboard } = (await client.mutation({
    createDashboard: { __args: { data: { title: 'E2E Reports', pageLayoutId: createPageLayout.id } }, id: true },
  } as never)) as unknown as { createDashboard: { id: string } };

  return { dashboardId: createDashboard.id, pageLayoutId: createPageLayout.id };
};

export const removeReportDashboard = async ({ dashboardId, pageLayoutId }: { dashboardId: string; pageLayoutId: string }) => {
  await new CoreApiClient().mutation({ deleteDashboard: { __args: { id: dashboardId }, id: true } } as never).catch(() => undefined);
  await metadataRequest('mutation ($id: String!) { deletePageLayout(id: $id) { id } }', { id: pageLayoutId }).catch(() => undefined);
};
