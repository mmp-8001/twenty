import { CoreApiClient } from 'twenty-client-sdk/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  AGENTS_VIEW_UNIVERSAL_IDENTIFIER,
  AWAITING_PAYMENT_VIEW_UNIVERSAL_IDENTIFIER,
  CALLS_VIEW_UNIVERSAL_IDENTIFIER,
  CAMPAIGNS_VIEW_UNIVERSAL_IDENTIFIER,
  CONTACT_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODES_VIEW_UNIVERSAL_IDENTIFIER,
  FAILED_PLATFORM_EVENTS_VIEW_UNIVERSAL_IDENTIFIER,
  FROZEN_AGENTS_VIEW_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOMES_VIEW_UNIVERSAL_IDENTIFIER,
  MY_CUSTOMERS_VIEW_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
  MY_REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  REASONS_VIEW_UNIVERSAL_IDENTIFIER,
  SEGMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  SETTINGS_VIEW_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { listRecords } from 'src/logic-functions/utils/records.util';

import { createAgent, linkMemberToAgent, listMembers, softDelete } from './fixtures';
import { assignRole, graphqlAs, listRoles, signInAs } from './user-session';

const client = new CoreApiClient();
const PHIL = 'phil.schiler@apple.dev';
const JONY = 'jony.ive@apple.dev';
const TIM = 'tim@apple.dev';
const SYNC_URL = `${process.env.TWENTY_API_URL}/s/sidebar/sync`;

type NavItem = {
  id: string;
  type: string;
  name: string | null;
  folderId: string | null;
  position: number;
  viewId: string | null;
  pageLayoutId: string | null;
  userWorkspaceId: string | null;
};

const ASSIGNED = new Map<string, string>();
const LINKED = new Set<string>();
const tokens = new Map<string, string>();
const createdAgentIds: string[] = [];
const ownItemsByToken: { token: string; id: string }[] = [];
let members: { id: string; userEmail: string }[] = [];
let roleIdByIdentifier = new Map<string, string>();
let previousRoleIdByMemberId = new Map<string, string>();
let targetIdByIdentifier = new Map<string, string>();

const memberIdOf = (email: string) => members.find(({ userEmail }) => userEmail === email)!.id;
const tokenOf = async (email: string) => {
  if (!tokens.has(email)) tokens.set(email, await signInAs(email));

  return tokens.get(email)!;
};

const setRole = async (email: string, identifier: string) => {
  await assignRole(memberIdOf(email), roleIdByIdentifier.get(identifier)!);
  ASSIGNED.set(email, identifier);
};

const sync = async (email: string, force?: boolean) => {
  const response = await fetch(SYNC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${await tokenOf(email)}` },
    body: JSON.stringify(force === undefined ? {} : { force }),
  });

  expect(response.status).toBe(200);

  return (await response.json()) as { changed: boolean };
};

const personalItemsOf = async (email: string) => {
  const result = await graphqlAs(await tokenOf(email), '{ __typename }');

  expect(result.errors).toBeUndefined();

  const response = await fetch(`${process.env.TWENTY_API_URL}/metadata`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${await tokenOf(email)}` },
    body: JSON.stringify({
      query: '{ navigationMenuItems { id type name folderId position viewId pageLayoutId userWorkspaceId } }',
    }),
  });
  const { data, errors } = (await response.json()) as {
    data: { navigationMenuItems: NavItem[] };
    errors?: { message: string }[];
  };

  expect(errors).toBeUndefined();

  return data.navigationMenuItems.filter(({ userWorkspaceId }) => userWorkspaceId !== null);
};

// Folders in position order, each with its children's targets (viewId or pageLayoutId) in position order.
const sidebarOf = async (email: string) => {
  const items = await personalItemsOf(email);

  return items
    .filter(({ type }) => type === 'FOLDER')
    .sort((left, right) => left.position - right.position)
    .map((folder) => ({
      name: folder.name,
      targets: items
        .filter(({ folderId }) => folderId === folder.id)
        .sort((left, right) => left.position - right.position)
        .map(({ viewId, pageLayoutId }) => viewId ?? pageLayoutId),
    }));
};

const idsOf = (identifiers: string[]) => identifiers.map((identifier) => targetIdByIdentifier.get(identifier)!);

const AGENT_TARGETS = [
  MY_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  CONTACT_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  MY_REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  MY_CUSTOMERS_VIEW_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
  CALLS_VIEW_UNIVERSAL_IDENTIFIER,
];
const SUPERVISOR_TARGETS = [
  CAMPAIGNS_VIEW_UNIVERSAL_IDENTIFIER,
  SEGMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  AGENTS_VIEW_UNIVERSAL_IDENTIFIER,
  FROZEN_AGENTS_VIEW_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOMES_VIEW_UNIVERSAL_IDENTIFIER,
  AWAITING_PAYMENT_VIEW_UNIVERSAL_IDENTIFIER,
];
const FULL_ADMIN_TARGETS = [
  ...SUPERVISOR_TARGETS,
  DISCOUNT_CODES_VIEW_UNIVERSAL_IDENTIFIER,
  REASONS_VIEW_UNIVERSAL_IDENTIFIER,
  SETTINGS_VIEW_UNIVERSAL_IDENTIFIER,
];
const TECHNICAL_ADMIN_TARGETS = [
  ...FULL_ADMIN_TARGETS,
  FAILED_PLATFORM_EVENTS_VIEW_UNIVERSAL_IDENTIFIER,
  CALLS_VIEW_UNIVERSAL_IDENTIFIER,
];

// Seed members use the English locale unless the seed says otherwise.
const folderName = async (email: string, names: { fa: string; en: string }) => {
  const [member] = await listRecords<{ locale: string | null }>(
    client,
    'workspaceMembers',
    { id: { eq: memberIdOf(email) } },
    { locale: true },
    1,
  );

  return member?.locale?.startsWith('fa') ? names.fa : names.en;
};
const MY_WORK = { fa: 'کار من', en: 'My work' };
const MANAGEMENT = { fa: 'مدیریت', en: 'Management' };

beforeAll(async () => {
  members = await listMembers(client);
  const roles = await listRoles();

  roleIdByIdentifier = new Map(roles.map(({ id, universalIdentifier }) => [universalIdentifier, id]));
  for (const email of [PHIL, JONY]) {
    previousRoleIdByMemberId.set(
      memberIdOf(email),
      roles.find((role) => role.workspaceMembers.some(({ id }) => id === memberIdOf(email)))!.id,
    );
  }

  const response = await fetch(`${process.env.TWENTY_API_URL}/metadata`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.TWENTY_API_KEY}` },
    body: JSON.stringify({ query: '{ getViews { id universalIdentifier } getPageLayouts { id universalIdentifier } }' }),
  });
  const { data } = (await response.json()) as {
    data: Record<'getViews' | 'getPageLayouts', { id: string; universalIdentifier: string }[]>;
  };

  targetIdByIdentifier = new Map(
    [...data.getViews, ...data.getPageLayouts].map(({ id, universalIdentifier }) => [universalIdentifier, id]),
  );
});

afterAll(async () => {
  try {
    for (const { token, id } of ownItemsByToken) {
      await fetch(`${process.env.TWENTY_API_URL}/metadata`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: 'mutation ($id: UUID!) { deleteNavigationMenuItem(id: $id) { id } }', variables: { id } }),
      });
    }

    // Clear the synced sidebars so no app items outlive the test.
    for (const email of [PHIL, JONY, TIM]) {
      if (tokens.has(email)) {
        const items = await personalItemsOf(email);
        const folderIds = items.filter(({ type }) => type === 'FOLDER').map(({ id }) => id);

        for (const id of [...items.filter(({ type }) => type !== 'FOLDER').map(({ id }) => id), ...folderIds]) {
          await fetch(`${process.env.TWENTY_API_URL}/metadata`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${tokens.get(email)}` },
            body: JSON.stringify({ query: 'mutation ($id: UUID!) { deleteNavigationMenuItem(id: $id) { id } }', variables: { id } }),
          });
        }
      }
    }
  } finally {
    try {
      for (const email of LINKED) await linkMemberToAgent(client, memberIdOf(email), null);
      for (const id of createdAgentIds) await softDelete(client, 'Agent', id);
    } finally {
      for (const [memberId, roleId] of previousRoleIdByMemberId) await assignRole(memberId, roleId);
    }
  }
});

describe('personal sidebar', () => {
  it('builds an Agent work folder, skips an unchanged sync and rebuilds identically when forced', async () => {
    await setRole(PHIL, AGENT_ROLE_UNIVERSAL_IDENTIFIER);

    expect(await sync(PHIL)).toEqual({ changed: true });

    const expected = [{ name: await folderName(PHIL, MY_WORK), targets: idsOf(AGENT_TARGETS) }];

    expect(await sidebarOf(PHIL)).toEqual(expected);
    expect(await sync(PHIL)).toEqual({ changed: false });
    expect(await sync(PHIL, true)).toEqual({ changed: true });
    expect(await sidebarOf(PHIL)).toEqual(expected);
  });

  it('keeps the user’s own personal items through a forced sync', async () => {
    const token = await tokenOf(PHIL);
    const [{ userWorkspaceId }] = await personalItemsOf(PHIL);
    const response = await fetch(`${process.env.TWENTY_API_URL}/metadata`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({
        query: `mutation ($input: CreateNavigationMenuItemInput!) { createNavigationMenuItem(input: $input) { id } }`,
        variables: { input: { type: 'FOLDER', name: 'phil own folder', icon: 'IconStar', userWorkspaceId } },
      }),
    });
    const { data, errors } = (await response.json()) as {
      data: { createNavigationMenuItem: { id: string } };
      errors?: { message: string }[];
    };

    expect(errors).toBeUndefined();
    ownItemsByToken.push({ token, id: data.createNavigationMenuItem.id });

    expect(await sync(PHIL, true)).toEqual({ changed: true });

    const own = (await personalItemsOf(PHIL)).filter(({ id }) => id === data.createNavigationMenuItem.id);

    expect(own).toHaveLength(1);
    expect(own[0]).toMatchObject({ type: 'FOLDER', name: 'phil own folder' });
    expect((await sidebarOf(PHIL)).map(({ name }) => name).sort()).toEqual([await folderName(PHIL, MY_WORK), 'phil own folder'].sort());
  });

  it('gives a Supervisor without an Agent Management, then adds the work folder once linked', async () => {
    await setRole(JONY, SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER);
    await sync(JONY, true);

    const management = { name: await folderName(JONY, MANAGEMENT), targets: idsOf(SUPERVISOR_TARGETS) };

    expect(management.targets).toHaveLength(6);
    expect(await sidebarOf(JONY)).toEqual([management]);

    const agent = await createAgent(client, `sidebar test ${Date.now()}`);

    createdAgentIds.push(agent);
    await linkMemberToAgent(client, memberIdOf(JONY), agent);
    LINKED.add(JONY);

    expect(await sync(JONY)).toEqual({ changed: true });
    expect(await sidebarOf(JONY)).toEqual([
      management,
      { name: await folderName(JONY, MY_WORK), targets: idsOf(AGENT_TARGETS) },
    ]);
  });

  it('gives a Full Admin nine management items', async () => {
    await setRole(JONY, FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER);
    await sync(JONY, true);

    expect(await sidebarOf(JONY)).toEqual([
      { name: await folderName(JONY, MANAGEMENT), targets: idsOf(FULL_ADMIN_TARGETS) },
    ]);
  });

  it('gives a technical admin eleven management items', async () => {
    expect(await sync(TIM, true)).toEqual({ changed: true });
    expect(await sidebarOf(TIM)).toEqual([
      { name: await folderName(TIM, MANAGEMENT), targets: idsOf(TECHNICAL_ADMIN_TARGETS) },
    ]);
  });
});
