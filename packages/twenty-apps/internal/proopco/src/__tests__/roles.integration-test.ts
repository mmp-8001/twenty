import { randomUUID } from 'crypto';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  createRecord,
  listRecords,
} from 'src/logic-functions/utils/records.util';

import { assertInvariants } from './assert-invariants';
import { createCampaign, listMembers, softDelete } from './fixtures';
import { assignRole, graphqlAs, listRoles, signInAs } from './user-session';

const client = new CoreApiClient();
const SUPERVISOR_EMAIL = 'jony.ive@apple.dev';
const AGENT_EMAIL = 'phil.schiler@apple.dev';
const END_NOW_URL = `${process.env.TWENTY_API_URL}/s/campaigns/end`;

let supervisorToken: string;
let agentToken: string;
let supervisorMemberId: string;
let agentMemberId: string;
const previousRoleIdByMemberId = new Map<string, string>();
const campaignIds: string[] = [];

const createCampaignAs = (token: string, data: Record<string, unknown>) =>
  graphqlAs(
    token,
    `mutation ($data: CampaignCreateInput!) { createCampaign(data: $data) { id status } }`,
    { data: { name: `test ${randomUUID()}`, startsAt: '2030-01-01', ...data } },
  );

const endNow = (token: string | null, campaignId: string) =>
  fetch(END_NOW_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ campaignId }),
  });

beforeAll(async () => {
  const members = await listMembers(client);
  const roles = await listRoles();
  const roleId = (universalIdentifier: string) =>
    roles.find((role) => role.universalIdentifier === universalIdentifier)!.id;

  supervisorMemberId = members.find(
    ({ userEmail }) => userEmail === SUPERVISOR_EMAIL,
  )!.id;
  agentMemberId = members.find(
    ({ userEmail }) => userEmail === AGENT_EMAIL,
  )!.id;

  for (const memberId of [supervisorMemberId, agentMemberId]) {
    previousRoleIdByMemberId.set(
      memberId,
      roles.find((role) =>
        role.workspaceMembers.some(({ id }) => id === memberId),
      )!.id,
    );
  }

  await assignRole(
    supervisorMemberId,
    roleId(SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER),
  );
  await assignRole(agentMemberId, roleId(AGENT_ROLE_UNIVERSAL_IDENTIFIER));
  supervisorToken = await signInAs(SUPERVISOR_EMAIL);
  agentToken = await signInAs(AGENT_EMAIL);
});

afterAll(async () => {
  for (const id of campaignIds) {
    await softDelete(client, 'Campaign', id);
  }

  for (const [memberId, roleId] of previousRoleIdByMemberId) {
    await assignRole(memberId, roleId);
  }

  await assertInvariants(client);
});

describe('Supervisor (AS1)', () => {
  it('creates and edits campaigns and segments but never writes the app-owned status', async () => {
    const created = await createCampaignAs(supervisorToken, {});
    const campaign = created.data?.createCampaign as { id: string } | undefined;

    expect(created.errors).toBeUndefined();
    expect(campaign?.id).toBeDefined();
    campaignIds.push(campaign!.id);

    const edited = await graphqlAs(
      supervisorToken,
      `mutation ($id: UUID!, $data: CampaignUpdateInput!) { updateCampaign(id: $id, data: $data) { id cooldownDays } }`,
      { id: campaign!.id, data: { cooldownDays: 14 } },
    );

    expect(edited.errors).toBeUndefined();

    const statusWrite = await graphqlAs(
      supervisorToken,
      `mutation ($id: UUID!, $data: CampaignUpdateInput!) { updateCampaign(id: $id, data: $data) { id } }`,
      { id: campaign!.id, data: { status: 'ENDED' } },
    );

    expect(statusWrite.errors?.length).toBeGreaterThan(0);

    const segment = await graphqlAs(
      supervisorToken,
      `mutation ($data: SegmentCreateInput!) { createSegment(data: $data) { id } }`,
      { data: { name: `test ${randomUUID()}` } },
    );

    expect(segment.errors).toBeUndefined();
    await softDelete(
      client,
      'Segment',
      (segment.data?.createSegment as { id: string }).id,
    );
  });

  it('cannot read the platform event inbox', async () => {
    const result = await graphqlAs(
      supervisorToken,
      `{ platformEventInboxes(first: 1) { edges { node { id } } } }`,
    );

    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('ends a campaign now through the route', async () => {
    const campaignId = await createCampaign(client, { startsAt: '2030-01-01' });

    campaignIds.push(campaignId);

    const response = await endNow(supervisorToken, campaignId);
    const [campaign] = await listRecords<{ status: string }>(
      client,
      'campaigns',
      { id: { eq: campaignId } },
      { status: true },
    );

    expect(response.status).toBe(200);
    expect(campaign.status).toBe('ENDED');
  });
});

describe('Agent', () => {
  it('cannot create or change campaigns, only read them', async () => {
    const campaignId = await createCampaign(client, { startsAt: '2030-01-01' });

    campaignIds.push(campaignId);

    const created = await createCampaignAs(agentToken, {});
    const read = await graphqlAs(
      agentToken,
      `query ($id: UUID!) { campaigns(filter: { id: { eq: $id } }) { edges { node { id } } } }`,
      { id: campaignId },
    );
    const ended = await endNow(agentToken, campaignId);

    expect(created.errors?.length).toBeGreaterThan(0);
    expect(read.errors).toBeUndefined();
    expect(ended.status).toBe(403);
  });

  it('is refused by the End now route without a session', async () => {
    expect([401, 403]).toContain((await endNow(null, randomUUID())).status);
  });
});

describe.skipIf(!process.env.ENTERPRISE_KEY)('row rules (rls)', () => {
  const personIds: string[] = [];

  const newPerson = async (data: Record<string, unknown>) => {
    const id = await createRecord(client, 'Person', {
      name: { firstName: 'Rls', lastName: randomUUID() },
      platformUserId: `u_${randomUUID()}`,
      ...data,
    });

    personIds.push(id);

    return id;
  };

  const idsVisibleToAgent = async (ids: string[]) => {
    const result = await graphqlAs(
      agentToken,
      `query ($ids: [UUID!]) { people(filter: { id: { in: $ids } }) { edges { node { id } } } }`,
      { ids },
    );

    return (
      result.data?.people as { edges: { node: { id: string } }[] }
    ).edges.map(({ node }) => node.id);
  };

  afterAll(async () => {
    for (const id of personIds) {
      await softDelete(client, 'Person', id);
    }
  });

  it('shows an Agent only owned and eligible contacts (S2)', async () => {
    const owned = await newPerson({
      ownerMemberId: agentMemberId,
      lifecycleStage: 'AWAITING_FIRST_CALL',
    });
    const eligible = await newPerson({ eligibleMemberIds: [agentMemberId] });
    const outOfScope = await newPerson({
      eligibleMemberIds: [supervisorMemberId],
    });
    const unscoped = await newPerson({});

    expect(
      (await idsVisibleToAgent([owned, eligible, outOfScope, unscoped])).sort(),
    ).toEqual([owned, eligible].sort());
  });

  it('hides an out-of-scope contact from search, direct link and REST', async () => {
    const lastName = `Hidden${randomUUID().replace(/-/g, '')}`;
    const hidden = await newPerson({
      name: { firstName: 'Rls', lastName },
      eligibleMemberIds: [],
    });

    const search = await graphqlAs(
      agentToken,
      `query ($term: String!) { search(searchInput: $term, limit: 20) { edges { node { recordId } } } }`,
      { term: lastName },
    );
    const rest = await fetch(
      `${process.env.TWENTY_API_URL}/rest/people/${hidden}`,
      {
        headers: { authorization: `Bearer ${agentToken}` },
      },
    );

    expect(JSON.stringify(search.data ?? {})).not.toContain(hidden);
    expect(rest.status).toBe(404);
    expect(await idsVisibleToAgent([hidden])).toEqual([]);
  });
});
