import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AGENT_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { countRecords, listRecords } from 'src/logic-functions/utils/records.util';
import { clearShowcase } from 'src/logic-functions/utils/showcase/clear-showcase.util';
import { seedShowcase } from 'src/logic-functions/utils/showcase/seed-showcase.util';
import {
  SHOWCASE_NAME_PREFIX,
  SHOWCASE_PLATFORM_USER_PREFIX,
} from 'src/logic-functions/utils/showcase/showcase-data.util';

import { assertInvariants } from './assert-invariants';
import { listMembers } from './fixtures';
import { assignRole, listRoles } from './user-session';

const client = new CoreApiClient();
const metadata = new MetadataApiClient();
const DEMO_EMAILS = ['phil.schiler@apple.dev', 'jony.ive@apple.dev'];
const previousRoleIdByMemberId = new Map<string, string>();
let caller = { memberId: '', name: 'Tim' };

const showcasePeople = { platformUserId: { like: `${SHOWCASE_PLATFORM_USER_PREFIX}%` } };
const showcaseAgents = { name: { like: `${SHOWCASE_NAME_PREFIX}%` } };

const seed = () => seedShowcase({ client, metadata, caller, now: new Date() });

beforeAll(async () => {
  const members = await listMembers(client);
  const roles = await listRoles();
  const agentRoleId = roles.find(({ universalIdentifier }) => universalIdentifier === AGENT_ROLE_UNIVERSAL_IDENTIFIER)!.id;

  caller = { memberId: members.find(({ userEmail }) => userEmail === 'tim@apple.dev')!.id, name: 'Tim' };
  await clearShowcase({ client, metadata, now: new Date() });

  for (const email of DEMO_EMAILS) {
    const memberId = members.find(({ userEmail }) => userEmail === email)!.id;

    previousRoleIdByMemberId.set(memberId, roles.find((role) => role.workspaceMembers.some(({ id }) => id === memberId))!.id);
    await assignRole(memberId, agentRoleId);
  }
});

// Roles go back even when clearing fails: the global teardown uninstalls the app and its Agent role with it.
afterAll(async () => {
  try {
    await clearShowcase({ client, metadata, now: new Date() });
  } finally {
    for (const [memberId, roleId] of previousRoleIdByMemberId) {
      await assignRole(memberId, roleId);
    }
  }
});

describe('showcase seed', () => {
  it('fills every section through the app logic', async () => {
    const result = await seed();

    expect(result.warnings).toEqual([]);
    expect(result.agents).toBe(2);
    expect(await countRecords(client, 'people', showcasePeople)).toBe(30);

    const agentIds = (await listRecords<{ id: string }>(client, 'agents', showcaseAgents, {})).map(({ id }) => id);
    const counts = {
      calls: await countRecords(client, 'calls', { agentId: { in: agentIds } }),
      deals: await countRecords(client, 'opportunities', { agentId: { in: agentIds } }),
      wonDeals: await countRecords(client, 'opportunities', { agentId: { in: agentIds }, dealStage: { eq: 'WON' } }),
      activations: await countRecords(client, 'codeActivations', { contactOwnerId: { in: agentIds } }),
      creditedPurchases: await countRecords(client, 'purchases', { creditedAgentId: { in: agentIds } }),
      freezes: await countRecords(client, 'freezePeriods', { agentId: { in: agentIds } }),
      waiting: await countRecords(client, 'platformEventInboxes', { status: { eq: 'WAITING_FOR_CONTACT' }, platformUserId: { like: `${SHOWCASE_PLATFORM_USER_PREFIX}%` } }),
    };

    expect(counts.calls).toBeGreaterThanOrEqual(15);
    expect(counts.deals).toBeGreaterThanOrEqual(14);
    expect(counts.wonDeals).toBeGreaterThanOrEqual(3);
    expect(counts.activations).toBeGreaterThanOrEqual(2);
    expect(counts.creditedPurchases).toBeGreaterThanOrEqual(3);
    expect(counts.freezes).toBe(1);
    expect(counts.waiting).toBe(1);
    await assertInvariants(client);
  });

  it('resumes without duplicating anything', async () => {
    const before = await countRecords(client, 'calls', {});
    const result = await seed();

    expect(await countRecords(client, 'people', showcasePeople)).toBe(30);
    expect(await countRecords(client, 'agents', showcaseAgents)).toBe(2);
    expect(await countRecords(client, 'calls', {})).toBe(before);
    expect(result.agents).toBe(2);
  });

  it('clears every showcase row and unlinks the members', async () => {
    await clearShowcase({ client, metadata, now: new Date() });

    expect(await countRecords(client, 'people', showcasePeople)).toBe(0);
    expect(await countRecords(client, 'agents', showcaseAgents)).toBe(0);
    expect(await countRecords(client, 'campaigns', showcaseAgents)).toBe(0);
    expect(await countRecords(client, 'platformEventInboxes', { platformUserId: { like: `${SHOWCASE_PLATFORM_USER_PREFIX}%` } })).toBe(0);

    const members = await listRecords<{ userEmail: string; agentId: string | null }>(client, 'workspaceMembers', {}, { userEmail: true, agentId: true });

    expect(members.filter(({ userEmail }) => DEMO_EMAILS.includes(userEmail)).map(({ agentId }) => agentId)).toEqual([null, null]);
    await assertInvariants(client);
  });
});
