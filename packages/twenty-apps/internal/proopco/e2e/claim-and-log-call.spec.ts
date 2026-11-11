import { expect, test } from '@playwright/test';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { listRecords } from '../src/logic-functions/utils/records.util';
import { cleanUpScene, createScene, type Scene } from './scene';
import { logBrowserProblems, signIn } from './utils';

const client = new CoreApiClient();
let scene: Scene;

test.beforeAll(async () => {
  scene = await createScene();
});

test.afterAll(async () => {
  await cleanUpScene(scene);
});

test.beforeEach(async ({ page }) => {
  logBrowserProblems(page);
  await signIn(page);
});

test('Add to follow-up takes a free contact for the signed-in agent', async ({ page }) => {
  await page.goto(`/object/person/${scene.personId}`);
  await page.getByRole('button', { name: /Add( to follow-up)?/ }).first().click();
  await expect(page.getByText('Added to your follow-ups')).toBeVisible();

  const [person] = await listRecords<{ ownerId: string | null }>(client, 'people', { id: { eq: scene.personId } }, { ownerId: true }, 1);

  expect(person.ownerId).toBe(scene.agentId);
});

test('Log call saves a call through the form', async ({ page }) => {
  await page.goto(`/object/person/${scene.personId}`);
  await page.getByRole('button', { name: 'Log call' }).first().click();
  await page.getByText('No answer').first().click();

  for (let step = 0; step < 6 && !(await page.getByRole('button', { name: 'Save' }).isVisible()); step += 1) {
    await page.getByRole('button', { name: 'Next' }).click();
  }

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Call saved.')).toBeVisible();

  const calls = await listRecords<{ id: string }>(client, 'calls', { contactId: { eq: scene.personId } }, {});

  expect(calls).toHaveLength(1);
});
