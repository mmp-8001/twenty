import { execFileSync } from 'child_process';
import { randomUUID } from 'crypto';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { DAY_MS, HOUR_MS, TEHRAN_OFFSET_MS } from 'src/constants/time.constant';
import { AGENT_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { runSweeper } from 'src/logic-functions/platform-event-sweeper';
import { type AgentActor } from 'src/logic-functions/utils/agent-actor.util';
import { claimContact } from 'src/logic-functions/utils/claim-contact.util';
import {
  loadEligibilityPlan,
  recomputeContactEligibility,
} from 'src/logic-functions/utils/eligibility.util';
import {
  failStalePendingActivations,
  loadOfferedCodes,
  resendSms,
  retryActivation,
} from 'src/logic-functions/utils/code-activation.util';
import {
  createDiscountCode,
  deactivateDiscountCode,
} from 'src/logic-functions/utils/discount-code.util';
import { createPlatformClient } from 'src/logic-functions/utils/platform-client.util';
import { logCall, type LogCallInput } from 'src/logic-functions/utils/log-call.util';
import { processAccountLastLost } from 'src/logic-functions/utils/process-last-lost.util';
import { processPurchase } from 'src/logic-functions/utils/process-purchase.util';
import { type PlatformEvent } from 'src/logic-functions/utils/parse-platform-envelope.util';
import { prepareCall } from 'src/logic-functions/utils/prepare-call.util';
import {
  createRecord,
  listRecords,
  updateRecord,
} from 'src/logic-functions/utils/records.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';
import { runEligibilityRefresh } from 'src/logic-functions/utils/refresh-eligibility.util';

import { formatJalaliTehranDateTime } from 'src/utils/jalali.util';

import { assertInvariants } from './assert-invariants';
import {
  addAgentToCampaign,
  addSegmentToCampaign,
  createAgent,
  createCampaign,
  createSegment,
  createSegmentView,
  deleteView,
  linkMemberToAgent,
  listMembers,
  softDelete,
} from './fixtures';
import { startStubServer, type StubRequest, type StubResponse } from './stub-server';
import { TEST_PLATFORM_TOKEN } from './test-constants';
import { assignRole, graphqlAs, listRoles, signInAs } from './user-session';

const client = new CoreApiClient();
const metadata = new MetadataApiClient();
const CLAIM_URL = `${process.env.TWENTY_API_URL}/s/contacts/claim`;
const LOST_RACE = "This user is in another agent's follow-ups.";
const PHIL = 'phil.schiler@apple.dev';
const SCOTT = 'scott.forstall@apple.dev';

type DealRow = {
  id: string;
  dealStage: string;
  dealType: string;
  closeReason: string | null;
  openDealKey: string | null;
  openedAt: string;
  deadlineAt: string;
  firstAnsweredCallAt: string | null;
  sourceCampaignId: string | null;
  agentId: string;
  slot1Status: string;
  slot2Status: string;
  slot3Status: string;
  slot4Status: string;
  slot5Status: string;
};

const DEAL_FIELDS = {
  dealStage: true,
  dealType: true,
  closeReason: true,
  openDealKey: true,
  openedAt: true,
  deadlineAt: true,
  firstAnsweredCallAt: true,
  sourceCampaignId: true,
  agentId: true,
  slot1Status: true,
  slot2Status: true,
  slot3Status: true,
  slot4Status: true,
  slot5Status: true,
};

const created: { singular: string; id: string }[] = [];
const viewIds: string[] = [];
const linkedMemberIds: string[] = [];
const previousRoleIdByMemberId = new Map<string, string>();
let members: { id: string; userEmail: string }[] = [];

const track = async (singular: string, id: Promise<string> | string) => {
  const resolved = await id;

  created.push({ singular, id: resolved });

  return resolved;
};

const memberIdOf = (email: string) => members.find(({ userEmail }) => userEmail === email)!.id;

type Scene = {
  country: string;
  campaignId: string;
  actors: AgentActor[];
};

// One Active campaign over a country segment, with one agent per given member.
const setUpScene = async (
  memberIds: string[],
  options: { startsAt?: string; country?: string; reuseSegmentOf?: Scene } = {},
): Promise<Scene> => {
  const country = options.country ?? `CL-${randomUUID()}`;
  const viewId = await createSegmentView([{ fieldName: 'country', operand: 'CONTAINS', value: country }]);

  viewIds.push(viewId);

  const segmentId = await track('Segment', createSegment(client, viewId));
  const campaignId = await track('Campaign', createCampaign(client, { startsAt: options.startsAt ?? '2026-01-01' }));

  await track('CampaignSegment', addSegmentToCampaign(client, campaignId, segmentId));

  const actors: AgentActor[] = [];

  for (const memberId of memberIds) {
    const agentId = await track('Agent', createAgent(client, `Agent ${randomUUID()}`));

    await linkMemberToAgent(client, memberId, agentId);
    linkedMemberIds.push(memberId);
    await track('CampaignAgent', addAgentToCampaign(client, campaignId, agentId));
    actors.push({ memberId, agentId, name: agentId });
  }

  await runEligibilityRefresh(new Date(), client, metadata);

  return { country, campaignId, actors };
};

const newContact = async (country: string) => {
  const personId = await track(
    'Person',
    createRecord(client, 'Person', {
      name: { firstName: 'Call', lastName: randomUUID().slice(0, 8) },
      platformUserId: `u_${randomUUID()}`,
      country,
    }),
  );

  await recomputeContactEligibility(client, await loadEligibilityPlan(client, metadata), personId);

  return personId;
};

const readPerson = async (personId: string) =>
  (
    await listRecords<{
      lifecycleStage: string;
      ownerId: string | null;
      ownerMemberId: string | null;
      eligibleMemberIds: string[] | null;
      nextCallAt: string | null;
      planProgress: string | null;
      callUrgency: string | null;
      lastCallSummary: string | null;
      deadlineAt: string | null;
      doNotContactAt: string | null;
      dealTypeLabel: string | null;
    }>(
      client,
      'people',
      { id: { eq: personId } },
      {
        lifecycleStage: true,
        ownerId: true,
        ownerMemberId: true,
        eligibleMemberIds: true,
        nextCallAt: true,
        planProgress: true,
        callUrgency: true,
        lastCallSummary: true,
        deadlineAt: true,
        doNotContactAt: true,
        dealTypeLabel: true,
      },
    )
  )[0];

const dealsOf = (personId: string) =>
  listRecords<DealRow>(client, 'opportunities', { pointOfContactId: { eq: personId } }, DEAL_FIELDS);

const openDealOf = async (personId: string) => (await dealsOf(personId)).find(({ openDealKey }) => openDealKey !== null)!;

const callsOf = (personId: string) =>
  listRecords<{
    technicalStatus: string;
    answered: boolean;
    callKind: string;
    slotNumber: number | null;
    completedSlot: number | null;
    outsidePlanReason: string | null;
    nextCallAt: string | null;
    otherReasonText: string | null;
  }>(client, 'calls', { contactId: { eq: personId } }, {
    technicalStatus: true,
    answered: true,
    callKind: true,
    slotNumber: true,
    completedSlot: true,
    outsidePlanReason: true,
    nextCallAt: true,
    otherReasonText: true,
  });

const claimNow = async (actor: AgentActor, personId: string) => {
  const result = await claimContact({ client, metadata, actor, personId, now: new Date() });

  created.push({ singular: 'Opportunity', id: result.dealId });

  return result;
};

const claimedContact = async (scene: Scene, actor = scene.actors[0]) => {
  const personId = await newContact(scene.country);

  await claimNow(actor, personId);

  return personId;
};

const refusalOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Refusal) {
      return error;
    }

    throw error;
  }

  throw new Error('Expected a refusal');
};

const dncReasonId = async () =>
  (
    await listRecords<{ id: string }>(client, 'reasons', { name: { like: '%درخواست%' } }, {}, 1)
  )[0].id;

const dissatisfactionReasonIds = async (count: number) =>
  (await listRecords<{ id: string }>(client, 'reasons', { kind: { eq: 'DISSATISFACTION' } }, {}, count)).map(({ id }) => id);

let callCounter = 0;

// Every saved call is logged with an injected clock; the deal under test is read for its own timeline.
const log = (
  actor: AgentActor,
  personId: string,
  now: Date,
  overrides: Partial<LogCallInput> & { next: LogCallInput['next'] },
) =>
  logCall(client, actor, {
    personId,
    idempotencyKey: `test-${(callCounter += 1)}-${randomUUID()}`,
    technicalStatus: 'NO_ANSWER',
    ...overrides,
  }, now);

const at = (deal: DealRow, days: number, hours = 0) =>
  new Date(new Date(deal.openedAt).getTime() + days * DAY_MS + hours * HOUR_MS);

const schedule = (when: Date, outsidePlanReason?: string): LogCallInput['next'] => ({
  mode: 'schedule',
  at: when.toISOString(),
  outsidePlanReason: outsidePlanReason ?? null,
});

afterEach(async () => {
  await assertInvariants(client);

  for (const id of linkedMemberIds.splice(0)) {
    await linkMemberToAgent(client, id, null);
  }

  for (const { id } of created.filter(({ singular }) => singular === 'Person')) {
    for (const child of [
      ...(await listRecords<{ id: string }>(client, 'opportunities', { pointOfContactId: { eq: id } }, {})).map((row) => ({ singular: 'Opportunity', id: row.id })),
      ...(await listRecords<{ id: string }>(client, 'purchases', { contactId: { eq: id } }, {})).map((row) => ({ singular: 'Purchase', id: row.id })),
      ...(await listRecords<{ id: string }>(client, 'codeActivations', { contactId: { eq: id } }, {})).map((row) => ({ singular: 'CodeActivation', id: row.id })),
    ]) {
      created.push(child);
    }
  }

  for (const { singular, id } of [...new Map(created.splice(0).map((entry) => [entry.id, entry])).values()].reverse()) {
    await softDelete(client, singular, id);
  }

  for (const id of viewIds.splice(0)) {
    await deleteView(id);
  }
});

beforeAll(async () => {
  members = await listMembers(client);
});

describe('claim (S1, S4)', () => {
  it('moves the contact to the first agent to click and tells the other it is taken (S1)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL), memberIdOf(SCOTT)]);
    const [agentA, agentB] = scene.actors;
    const personId = await newContact(scene.country);

    expect((await readPerson(personId)).eligibleMemberIds?.sort()).toEqual([agentA.memberId, agentB.memberId].sort());

    const result = await claimNow(agentB, personId);
    const lost = await refusalOf(claimNow(agentA, personId));
    const person = await readPerson(personId);
    const [deal, ...others] = await dealsOf(personId);

    expect(result.campaignName).toBeTruthy();
    expect(lost.message).toBe(LOST_RACE);
    expect(lost.status).toBe(409);
    expect(person).toMatchObject({
      lifecycleStage: 'AWAITING_FIRST_CALL',
      ownerId: agentB.agentId,
      ownerMemberId: agentB.memberId,
      eligibleMemberIds: [],
      planProgress: 'Day 1 of 7',
      dealTypeLabel: 'Campaign',
    });
    expect(others).toEqual([]);
    expect(deal).toMatchObject({
      dealType: 'CAMPAIGN',
      dealStage: 'AWAITING_FIRST_CALL',
      openDealKey: personId,
      agentId: agentB.agentId,
      sourceCampaignId: scene.campaignId,
    });
    expect(new Date(deal.deadlineAt).getTime() - new Date(deal.openedAt).getTime()).toBe(7 * DAY_MS);

    const [agentRow] = await listRecords<{ ownedContactCount: number }>(
      client,
      'agents',
      { id: { eq: agentB.agentId } },
      { ownedContactCount: true },
    );

    expect(agentRow.ownedContactCount).toBe(1);
  });

  it('credits the earliest started Active campaign of the agent', async () => {
    const earlier = await setUpScene([memberIdOf(PHIL)], { startsAt: '2026-01-01' });
    const viewId = await createSegmentView([{ fieldName: 'country', operand: 'CONTAINS', value: earlier.country }]);

    viewIds.push(viewId);

    const segmentId = await track('Segment', createSegment(client, viewId));
    const laterCampaignId = await track('Campaign', createCampaign(client, { startsAt: '2026-06-01' }));

    await track('CampaignSegment', addSegmentToCampaign(client, laterCampaignId, segmentId));
    await track('CampaignAgent', addAgentToCampaign(client, laterCampaignId, earlier.actors[0].agentId));
    await runEligibilityRefresh(new Date(), client, metadata);

    const personId = await newContact(earlier.country);

    await claimNow(earlier.actors[0], personId);

    expect((await openDealOf(personId)).sourceCampaignId).toBe(earlier.campaignId);
  });

  it('refuses a contact outside the agent lists', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const outsider = await track(
      'Person',
      createRecord(client, 'Person', {
        name: { firstName: 'Out', lastName: 'Side' },
        platformUserId: `u_${randomUUID()}`,
        country: `XX-${randomUUID()}`,
      }),
    );

    expect((await refusalOf(claimNow(scene.actors[0], outsider))).code).toBe('NOT_ELIGIBLE');
  });

  it('moves the owner rebuy contact into follow-up for the configured days', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const personId = await track(
      'Person',
      createRecord(client, 'Person', {
        name: { firstName: 'Re', lastName: 'Buy' },
        platformUserId: `u_${randomUUID()}`,
        lifecycleStage: 'REBUY_WINDOW',
        ownerId: actor.agentId,
        ownerMemberId: actor.memberId,
      }),
    );
    const openedAt = new Date();

    await track(
      'Opportunity',
      createRecord(client, 'Opportunity', {
        name: 'rebuy',
        pointOfContactId: personId,
        dealType: 'REBUY',
        dealStage: 'REBUY_WINDOW',
        openDealKey: personId,
        openedAt: openedAt.toISOString(),
        deadlineAt: new Date(openedAt.getTime() + 72 * HOUR_MS).toISOString(),
        agentId: actor.agentId,
        agentMemberId: actor.memberId,
        contactOwnerId: actor.agentId,
        contactOwnerMemberId: actor.memberId,
      }),
    );

    const result = await claimNow(actor, personId);
    const deal = await openDealOf(personId);

    expect(result.kind).toBe('REBUY');
    expect(deal.dealStage).toBe('IN_FOLLOW_UP');
    expect(Math.round((new Date(deal.deadlineAt).getTime() - Date.now()) / DAY_MS)).toBe(30);
    expect((await readPerson(personId)).lifecycleStage).toBe('IN_FOLLOW_UP');
  });

  it('releases a claim that never got its deal, and leaves a claim that has one (reconciler)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const healthy = await claimedContact(scene);
    const orphan = await newContact(scene.country);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    await updateRecord(client, 'Person', orphan, {
      ownerId: actor.agentId,
      ownerMemberId: actor.memberId,
      lifecycleStage: 'AWAITING_FIRST_CALL',
      eligibleMemberIds: [],
      ownedSince: tenMinutesAgo,
    });

    const { releasedClaims } = await runSweeper(new Date(), client);
    const released = await readPerson(orphan);

    expect(releasedClaims).toBeGreaterThanOrEqual(1);
    expect(released).toMatchObject({ lifecycleStage: 'FREE', ownerId: null, eligibleMemberIds: [actor.memberId] });
    expect((await readPerson(healthy)).ownerId).toBe(actor.agentId);
  });
});

describe('claim and sweeper', () => {
  it('never leaves an owner without a deal when the sweeper runs during claims', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);

    for (let run = 0; run < 10; run += 1) {
      const personId = await newContact(scene.country);

      await Promise.all([claimNow(scene.actors[0], personId), runSweeper(new Date(), client)]);

      expect((await readPerson(personId)).ownerId).toBe(scene.actors[0].agentId);
      expect(await dealsOf(personId)).toHaveLength(1);
    }
  });
});

describe('claim route', () => {
  let philToken: string;
  let janeToken: string;

  const claimAs = (token: string | null, personId: string) =>
    fetch(CLAIM_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ personId }),
    });

  beforeAll(async () => {
    const roles = await listRoles();
    const agentRole = roles.find(({ universalIdentifier }) => universalIdentifier === AGENT_ROLE_UNIVERSAL_IDENTIFIER)!;

    for (const email of [PHIL, SCOTT]) {
      const memberId = memberIdOf(email);

      previousRoleIdByMemberId.set(
        memberId,
        roles.find(({ workspaceMembers }) => workspaceMembers.some(({ id }) => id === memberId))!.id,
      );
      await assignRole(memberId, agentRole.id);
    }

    philToken = await signInAs(PHIL);
    janeToken = await signInAs(SCOTT);
  });

  afterAll(async () => {
    for (const [memberId, roleId] of previousRoleIdByMemberId) {
      await assignRole(memberId, roleId);
    }
  });

  it('lets the first signed-in agent win and refuses everyone without an active agent (S1, G6)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL), memberIdOf(SCOTT)]);
    const personId = await newContact(scene.country);

    expect([401, 403]).toContain((await claimAs(null, personId)).status);

    const won = await claimAs(philToken, personId);

    expect(won.status).toBe(200);
    expect(((await won.json()) as { campaignName: string }).campaignName).toBeTruthy();

    const lost = await claimAs(janeToken, personId);

    expect(lost.status).toBe(409);
    expect(((await lost.json()) as { error: { message: string } }).error.message).toBe(LOST_RACE);

    const another = await newContact(scene.country);
    const fullAdminToken = await signInAs('tim@apple.dev');
    const withoutAgent = await claimAs(fullAdminToken, another);

    expect(withoutAgent.status).toBe(403);
    expect(((await withoutAgent.json()) as { error: { code: string } }).error.code).toBe('NO_ACTIVE_AGENT');

    const [openDeal] = await dealsOf(personId);

    created.push({ singular: 'Opportunity', id: (await listRecords<{ id: string }>(client, 'opportunities', { openDealKey: { eq: personId } }, {}))[0].id });
    expect(openDeal.openDealKey).toBe(personId);
  });
});

describe.skipIf(!process.env.ENTERPRISE_KEY)('row rules on calls and deals (rls)', () => {
  it('shows a call and its deal only to the owner agent (S2, S3)', async () => {
    const roles = await listRoles();
    const agentRole = roles.find(({ universalIdentifier }) => universalIdentifier === AGENT_ROLE_UNIVERSAL_IDENTIFIER)!;
    const previous = new Map<string, string>();

    for (const email of [PHIL, SCOTT]) {
      const memberId = memberIdOf(email);

      previous.set(memberId, roles.find(({ workspaceMembers }) => workspaceMembers.some(({ id }) => id === memberId))!.id);
      await assignRole(memberId, agentRole.id);
    }

    try {
      const scene = await setUpScene([memberIdOf(PHIL), memberIdOf(SCOTT)]);
      const [owner] = scene.actors;
      const personId = await claimedContact(scene, owner);
      const deal = await openDealOf(personId);

      await log(owner, personId, at(deal, 1), { next: schedule(at(deal, 2)) });

      const visible = async (token: string) => {
        const result = await graphqlAs(
          token,
          `query ($id: UUID!) { people(filter: { id: { eq: $id } }) { edges { node { id } } } calls(filter: { contactId: { eq: $id } }) { edges { node { id } } } opportunities(filter: { pointOfContactId: { eq: $id } }) { edges { node { id } } } }`,
          { id: personId },
        );
        const count = (key: string) => (result.data?.[key] as { edges: unknown[] }).edges.length;

        return [count('people'), count('calls'), count('opportunities')];
      };

      expect(await visible(await signInAs(PHIL))).toEqual([1, 1, 1]);
      expect(await visible(await signInAs(SCOTT))).toEqual([0, 0, 0]);
    } finally {
      for (const [memberId, roleId] of previous) {
        await assignRole(memberId, roleId);
      }
    }
  });
});

const RACE_AGENTS = 20;
const RACE_RUNS = 50;
const PG_URL = process.env.PG_DATABASE_URL;

// Extra workspace members cannot be created through any API, so the test inserts them next to the seeded ones.
const ensureRaceMembers = async (count: number) => {
  const psql = (sql: string) => execFileSync('psql', [PG_URL!, '-At', '-c', sql], { encoding: 'utf8' }).trim();
  const schema = psql(
    `select table_schema from information_schema.tables where table_name = 'workspaceMember' and table_schema like 'workspace_%'`,
  )
    .split('\n')
    .find((candidate) => psql(`select 1 from ${candidate}."workspaceMember" where "userEmail" = 'tim@apple.dev'`) === '1')!;

  for (let index = 1; index <= count; index += 1) {
    psql(
      `insert into ${schema}."workspaceMember" ("nameFirstName", "nameLastName", "userEmail", "userId") select 'Race', '${index}', 'race${index}@apple.dev', '00000000-0000-4000-8000-${String(index).padStart(12, '0')}'::uuid where not exists (select 1 from ${schema}."workspaceMember" where "userEmail" = 'race${index}@apple.dev')`,
    );
  }

  return (await listMembers(client)).filter(({ userEmail }) => userEmail.startsWith('race')).slice(0, count);
};

describe.skipIf(!PG_URL)('claim race (S4)', () => {
  it(`gives one owner, one open deal and ${RACE_AGENTS - 1} errors for ${RACE_AGENTS} agents racing ${RACE_RUNS} times`, async () => {
    const raceMembers = await ensureRaceMembers(RACE_AGENTS);
    const scene = await setUpScene(raceMembers.map(({ id }) => id));

    for (let run = 0; run < RACE_RUNS; run += 1) {
      const personId = await newContact(scene.country);
      const outcomes = await Promise.allSettled(
        scene.actors.map((actor) => claimContact({ client, metadata, actor, personId, now: new Date() })),
      );
      const won = outcomes.filter(({ status }) => status === 'fulfilled');
      const lost = outcomes.filter((outcome) => outcome.status === 'rejected') as PromiseRejectedResult[];

      expect(won).toHaveLength(1);
      expect(lost).toHaveLength(RACE_AGENTS - 1);
      expect(
        [...new Set(lost.map(({ reason }) => (reason instanceof Refusal ? reason.code : String(reason?.message ?? reason))))],
      ).toEqual(['CLAIM_LOST']);

      const person = await readPerson(personId);
      const deals = await dealsOf(personId);

      expect(person.ownerId).not.toBeNull();
      expect(deals).toHaveLength(1);
      expect(deals[0].agentId).toBe(person.ownerId);
      created.push({ singular: 'Opportunity', id: (await listRecords<{ id: string }>(client, 'opportunities', { openDealKey: { eq: personId } }, {}))[0].id });
    }
  }, 1_800_000);
});

describe('Log call', () => {
  it('saves an unanswered call with a status and a next time and nothing else (TS2)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    const now = at(deal, 0, 3);
    const [reasonId] = await dissatisfactionReasonIds(1);

    expect((await refusalOf(log(actor, personId, now, { technicalStatus: 'ANSWERED', next: schedule(at(deal, 1)) }))).code).toBe('REASON_REQUIRED');
    expect((await refusalOf(log(actor, personId, now, { technicalStatus: 'BUSY', reasonIds: [reasonId], next: schedule(at(deal, 1)) }))).code).toBe('REASONS_NOT_ALLOWED');
    expect((await refusalOf(log(actor, personId, now, { technicalStatus: 'BUSY', next: { mode: 'none' } }))).code).toBe('NEXT_CALL_REQUIRED');
    expect((await refusalOf(log(actor, personId, now, { technicalStatus: 'NOPE', next: schedule(at(deal, 1)) }))).code).toBe('INVALID_STATUS');

    await log(actor, personId, now, { technicalStatus: 'BUSY', next: schedule(at(deal, 1)), note: 'later' });

    const person = await readPerson(personId);
    const after = await openDealOf(personId);

    expect(person).toMatchObject({ lifecycleStage: 'AWAITING_FIRST_CALL', nextCallAt: at(deal, 1).toISOString() });
    expect(person.lastCallSummary).toBe('Busy');
    expect(after.deadlineAt).toBe(deal.deadlineAt);
    expect(await callsOf(personId)).toHaveLength(1);
  });

  it('starts the follow-up and slot 1 on the first answered call', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    const now = at(deal, 2);
    const [first, second] = await dissatisfactionReasonIds(2);
    const prepared = await prepareCall(client, actor, personId, now);

    expect(prepared.answered.defaultNextCallAt).toBe(at(deal, 3).toISOString());
    expect(prepared.unanswered.defaultNextCallAt).toBe(at(deal, 3).toISOString());

    await log(actor, personId, now, {
      technicalStatus: 'ANSWERED',
      reasonIds: [first, second],
      otherReasonText: 'wants a demo',
      next: schedule(at(deal, 4)),
    });

    const after = await openDealOf(personId);
    const [call] = await callsOf(personId);
    const person = await readPerson(personId);

    expect(after).toMatchObject({ dealStage: 'IN_FOLLOW_UP', firstAnsweredCallAt: now.toISOString(), slot1Status: 'DONE', slot2Status: 'PENDING' });
    expect(after.deadlineAt).toBe(new Date(now.getTime() + 30 * DAY_MS).toISOString());
    expect(call).toMatchObject({ answered: true, slotNumber: 1, completedSlot: 1, otherReasonText: 'wants a demo' });
    expect(person.lifecycleStage).toBe('IN_FOLLOW_UP');
    expect(person.deadlineAt).toBe(after.deadlineAt);
    expect(person.planProgress).toBe('Slot 1 of 5 · day 1 of 30');
    expect(person.lastCallSummary).toContain('wants a demo');

    const callReasons = await listRecords<{ reasonId: string }>(client, 'callReasons', { callId: { eq: (await listRecords<{ id: string }>(client, 'calls', { contactId: { eq: personId } }, {}))[0].id } }, { reasonId: true });

    expect(callReasons.map(({ reasonId }) => reasonId).sort()).toEqual([first, second].sort());
  });

  it('requires text for Other and keeps a deactivated reason on the saved call (TS7)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    const reasonId = await track('Reason', createRecord(client, 'Reason', { name: `r-${randomUUID()}`, kind: 'SATISFACTION', isActive: true }));

    await updateRecord(client, 'Reason', reasonId, { isActive: false });
    expect((await refusalOf(log(actor, personId, at(deal, 1), { technicalStatus: 'ANSWERED', reasonIds: [reasonId], next: schedule(at(deal, 2)) }))).code).toBe('INVALID_REASON');
    await updateRecord(client, 'Reason', reasonId, { isActive: true });

    expect((await refusalOf(log(actor, personId, at(deal, 1), { technicalStatus: 'ANSWERED', otherReasonText: '  ', next: schedule(at(deal, 2)) }))).code).toBe('REASON_REQUIRED');

    await log(actor, personId, at(deal, 1), { technicalStatus: 'ANSWERED', reasonIds: [reasonId], next: schedule(at(deal, 2)) });
    await updateRecord(client, 'Reason', reasonId, { isActive: false });

    const linked = await listRecords<{ reasonId: string }>(client, 'callReasons', { reasonId: { eq: reasonId } }, { reasonId: true });

    expect(linked).toHaveLength(1);
  });

  it('closes the deal Lost on Do not contact, and still requires satisfaction reasons when answered (TS3)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    const now = at(deal, 1);
    const reasonId = await dncReasonId();
    const [dissatisfied] = await dissatisfactionReasonIds(1);

    expect((await refusalOf(log(actor, personId, now, { technicalStatus: 'ANSWERED', next: { mode: 'doNotContact', reasonId } }))).code).toBe('REASON_REQUIRED');
    expect((await refusalOf(log(actor, personId, now, { technicalStatus: 'ANSWERED', reasonIds: [dissatisfied], next: { mode: 'doNotContact', reasonId: dissatisfied } }))).code).toBe('DO_NOT_CONTACT_REASON_REQUIRED');

    await log(actor, personId, now, { technicalStatus: 'ANSWERED', reasonIds: [dissatisfied], next: { mode: 'doNotContact', reasonId } });

    const closed = (await dealsOf(personId))[0];
    const person = await readPerson(personId);

    expect(closed).toMatchObject({ dealStage: 'LOST', closeReason: 'DO_NOT_CONTACT', openDealKey: '' });
    expect(person).toMatchObject({ lifecycleStage: 'DO_NOT_CONTACT', nextCallAt: null, eligibleMemberIds: [] });
    expect(person.doNotContactAt).toBe(now.toISOString());
    expect((await refusalOf(log(actor, personId, now, { next: schedule(at(deal, 2)) }))).code).toBe('STAGE_NOT_CALLABLE');
  });

  it('refuses everyone but the owner, rebuy contacts, ended follow-ups and not-callable stages (TS8, S3)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL), memberIdOf(SCOTT)]);
    const [owner, other] = scene.actors;
    const personId = await claimedContact(scene, owner);
    const deal = await openDealOf(personId);
    const deadline = new Date(deal.deadlineAt);
    const free = await newContact(scene.country);

    expect((await refusalOf(log(other, personId, at(deal, 1), { next: schedule(at(deal, 2)) }))).code).toBe('NOT_OWNER');
    expect((await refusalOf(log(owner, free, at(deal, 1), { next: schedule(at(deal, 2)) }))).code).toBe('NOT_OWNER');

    for (const when of [new Date(deadline.getTime() + 60_000), new Date(deadline.getTime() + 30 * 60_000), deadline]) {
      expect((await refusalOf(log(owner, personId, when, { next: schedule(deadline) }))).code).toBe('FOLLOW_UP_ENDED');
    }

    await log(owner, personId, new Date(deadline.getTime() - 60_000), { next: schedule(deadline) });

    await updateRecord(client, 'Person', personId, { lifecycleStage: 'REBUY_WINDOW' });
    expect((await refusalOf(log(owner, personId, at(deal, 1), { next: schedule(at(deal, 2)) }))).code).toBe('REBUY_ADD_FIRST');
    await updateRecord(client, 'Person', personId, { lifecycleStage: 'COOL_DOWN' });
    expect((await refusalOf(log(owner, personId, at(deal, 1), { next: schedule(at(deal, 2)) }))).code).toBe('STAGE_NOT_CALLABLE');
    await updateRecord(client, 'Person', personId, { lifecycleStage: 'IN_FOLLOW_UP' });
  });

  it('saves a call once however often the form is submitted', async () => {
    const scene = await setUpScene([memberIdOf(PHIL), memberIdOf(SCOTT)]);
    const [actor, other] = scene.actors;
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    const input: LogCallInput = {
      personId,
      idempotencyKey: `once-${randomUUID()}`,
      technicalStatus: 'BUSY',
      next: schedule(at(deal, 1)),
    };

    const results = await Promise.all([1, 2, 3].map(() => logCall(client, actor, input, at(deal, 0, 2))));
    const again = await logCall(client, actor, input, at(deal, 0, 3));

    expect(new Set([...results, again].map(({ callId }) => callId)).size).toBe(1);
    expect(await callsOf(personId)).toHaveLength(1);
    expect((await refusalOf(logCall(client, other, input, at(deal, 0, 3)))).code).toBe('IDEMPOTENCY_KEY_TAKEN');
  });

  it('keeps an unanswered call out of its slot and suggests a time inside the window (QS1)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    const [reasonId] = await dissatisfactionReasonIds(1);
    const firstCall = at(deal, 1);

    await log(actor, personId, firstCall, { technicalStatus: 'ANSWERED', reasonIds: [reasonId], next: schedule(at(deal, 3)) });

    const dayFive = new Date(firstCall.getTime() + 5 * DAY_MS);
    const prepared = await prepareCall(client, actor, personId, dayFive);

    expect(prepared.unanswered.defaultNextCallAt).toBe(new Date(dayFive.getTime() + DAY_MS).toISOString());

    await log(actor, personId, dayFive, { technicalStatus: 'NO_ANSWER', next: schedule(new Date(dayFive.getTime() + DAY_MS)) });

    const after = await openDealOf(personId);
    const calls = await callsOf(personId);

    expect(after.slot3Status).toBe('PENDING');
    expect(calls.find(({ answered }) => !answered)).toMatchObject({ slotNumber: 3, completedSlot: null });
  });

  it('allows a time outside the plan only with a reason, and marks Moved slots on user request (QS2)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    const [reasonId] = await dissatisfactionReasonIds(1);
    const first = at(deal, 1);
    const dayTwo = new Date(first.getTime() + 2 * DAY_MS);
    const dayTen = new Date(first.getTime() + 10 * DAY_MS);

    await log(actor, personId, first, { technicalStatus: 'ANSWERED', reasonIds: [reasonId], next: schedule(dayTwo) });
    await log(actor, personId, dayTwo, { technicalStatus: 'ANSWERED', reasonIds: [reasonId], next: schedule(dayTen, 'ADMIN_DECISION') }).then(async () => {
      expect((await openDealOf(personId)).slot3Status).toBe('PENDING');
    });

    expect((await refusalOf(log(actor, personId, new Date(dayTwo.getTime() + HOUR_MS), { technicalStatus: 'NO_ANSWER', next: schedule(dayTen) }))).code).toBe('OUTSIDE_PLAN_REASON_REQUIRED');

    await log(actor, personId, new Date(dayTwo.getTime() + 2 * HOUR_MS), { technicalStatus: 'NO_ANSWER', next: schedule(dayTen, 'USER_REQUEST') });
    expect((await openDealOf(personId)).slot3Status).toBe('MOVED');

    await log(actor, personId, dayTen, { technicalStatus: 'ANSWERED', reasonIds: [reasonId], next: schedule(new Date(dayTen.getTime() + DAY_MS)) });

    const afterDayTen = await openDealOf(personId);

    expect(afterDayTen).toMatchObject({ slot2Status: 'DONE', slot3Status: 'MOVED', slot4Status: 'DONE' });
    expect((await callsOf(personId)).find(({ completedSlot }) => completedSlot === 4)).toBeDefined();
  });

  it('caps the next call at the deadline, in the server and in the suggestion (QS5)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    const [reasonId] = await dissatisfactionReasonIds(1);
    const first = at(deal, 1);

    await log(actor, personId, first, { technicalStatus: 'ANSWERED', reasonIds: [reasonId], next: schedule(at(deal, 2)) });

    const dayTwentySeven = new Date(first.getTime() + 27 * DAY_MS);
    const deadline = new Date((await openDealOf(personId)).deadlineAt);

    expect(deadline.getTime()).toBe(first.getTime() + 30 * DAY_MS);
    expect((await refusalOf(log(actor, personId, dayTwentySeven, { technicalStatus: 'NO_ANSWER', next: schedule(new Date(first.getTime() + 34 * DAY_MS), 'USER_REQUEST') }))).code).toBe('NEXT_CALL_AFTER_DEADLINE');

    await log(actor, personId, dayTwentySeven, { technicalStatus: 'NO_ANSWER', next: schedule(deadline, 'USER_REQUEST') });
    expect((await readPerson(personId)).nextCallAt).toBe(deadline.toISOString());
  });

  it('accepts twenty answered forms without blocking or flagging them (TS6)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    const [reasonId] = await dissatisfactionReasonIds(1);

    for (let index = 0; index < 20; index += 1) {
      await log(actor, personId, at(deal, 1, index), {
        technicalStatus: 'ANSWERED',
        reasonIds: [reasonId],
        next: schedule(at(deal, 1, index + 1)),
      });
    }

    expect((await callsOf(personId)).filter(({ answered }) => answered)).toHaveLength(20);
  });

  it('logs retention calls on a Customer: next time optional, labeled Retention, Do not contact allowed (TS4, U3)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const [reasonId] = await dissatisfactionReasonIds(1);
    const newCustomer = async () =>
      track(
        'Person',
        createRecord(client, 'Person', {
          name: { firstName: 'Cus', lastName: randomUUID().slice(0, 8) },
          platformUserId: `u_${randomUUID()}`,
          lifecycleStage: 'CUSTOMER',
          ownerId: actor.agentId,
          ownerMemberId: actor.memberId,
        }),
      );
    const customer = await newCustomer();
    const now = new Date();
    const prepared = await prepareCall(client, actor, customer, now);

    expect(prepared.kind).toBe('RETENTION');
    expect(prepared.answered.defaultNextCallAt).toBeNull();
    expect((await refusalOf(log(actor, customer, now, { technicalStatus: 'BUSY', next: { mode: 'none' } }))).code).toBe('NEXT_CALL_REQUIRED');

    await log(actor, customer, now, { technicalStatus: 'ANSWERED', reasonIds: [reasonId], next: { mode: 'none' } });

    expect(await callsOf(customer)).toMatchObject([{ callKind: 'RETENTION', answered: true, slotNumber: null }]);
    expect(await readPerson(customer)).toMatchObject({ lifecycleStage: 'CUSTOMER', nextCallAt: null, dealTypeLabel: 'Retention' });
    expect(await dealsOf(customer)).toEqual([]);

    const leaving = await newCustomer();

    await log(actor, leaving, now, { technicalStatus: 'ANSWERED', reasonIds: [reasonId], next: { mode: 'doNotContact', reasonId: await dncReasonId() } });

    const [deal] = await dealsOf(leaving);

    created.push({ singular: 'Opportunity', id: (await listRecords<{ id: string }>(client, 'opportunities', { pointOfContactId: { eq: leaving } }, {}))[0].id });
    expect(deal).toMatchObject({ dealStage: 'LOST', closeReason: 'DO_NOT_CONTACT', openDealKey: '' });
    expect((await readPerson(leaving)).lifecycleStage).toBe('DO_NOT_CONTACT');
  });
});

const GRACE_MS = HOUR_MS;

const sweepAt = (now: Date) => runSweeper(now, client);

const platformUserIdOf = async (personId: string) =>
  (await listRecords<{ platformUserId: string }>(client, 'people', { id: { eq: personId } }, { platformUserId: true }, 1))[0].platformUserId;

const platformEvent = (type: PlatformEvent['type'], occurredAt: Date, data: Record<string, unknown>): PlatformEvent => ({
  eventId: randomUUID(),
  type,
  schemaVersion: '1.0',
  occurredAt: occurredAt.toISOString(),
  data,
});

const buy = async (personId: string, occurredAt: Date, amountUsdt = '500.00', now = occurredAt) =>
  processPurchase(
    client,
    platformEvent('purchase.settled', occurredAt, {
      platformPurchaseId: `p_${randomUUID()}`,
      platformUserId: await platformUserIdOf(personId),
      amountUsdt,
      codeUsed: null,
    }),
    now,
  );

const loseAccount = async (personId: string, occurredAt: Date, now = occurredAt) =>
  processAccountLastLost(
    client,
    platformEvent('account.last_lost', occurredAt, { platformUserId: await platformUserIdOf(personId) }),
    now,
  );

const purchasesOf = (personId: string) =>
  listRecords<{
    amountUsdt: number;
    commissionUsdt: number | null;
    creditedAgentId: string | null;
    dealId: string | null;
    contactOwnerId: string | null;
  }>(client, 'purchases', { contactId: { eq: personId } }, {
    amountUsdt: true,
    commissionUsdt: true,
    creditedAgentId: true,
    dealId: true,
    contactOwnerId: true,
  });

const answered = async (scene: Scene, personId: string, when: Date) => {
  const [reasonId] = await dissatisfactionReasonIds(1);

  await log(scene.actors[0], personId, when, {
    technicalStatus: 'ANSWERED',
    reasonIds: [reasonId],
    next: schedule(new Date(when.getTime() + DAY_MS)),
  });

  return openDealOf(personId);
};

const newCustomerOf = async (actor: AgentActor) => {
  const personId = await track(
    'Person',
    createRecord(client, 'Person', {
      name: { firstName: 'Cus', lastName: randomUUID().slice(0, 8) },
      platformUserId: `u_${randomUUID()}`,
      lifecycleStage: 'CUSTOMER',
      ownerId: actor.agentId,
      ownerMemberId: actor.memberId,
    }),
  );

  return personId;
};

describe('sweeper deadlines (TS1)', () => {
  it('closes an unanswered first-call deal only after the deadline and the grace, and frees the contact', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    const deadline = new Date(deal.deadlineAt).getTime();

    for (const offset of [-60_000, 60_000, GRACE_MS - 60_000]) {
      await sweepAt(new Date(deadline + offset));

      expect(await openDealOf(personId)).toMatchObject({ dealStage: 'AWAITING_FIRST_CALL' });
    }

    const closedAt = new Date(deadline + GRACE_MS + 60_000);

    await sweepAt(closedAt);

    const [closed] = await dealsOf(personId);

    expect(closed).toMatchObject({ dealStage: 'LOST', closeReason: 'UNANSWERED_AT_FIRST_CALL' });
    expect(closed.openDealKey ?? '').toBe('');
    expect(await readPerson(personId)).toMatchObject({ lifecycleStage: 'FREE', ownerId: null, ownerMemberId: null, nextCallAt: null, planProgress: '' });
    expect(await sweepAt(closedAt)).toMatchObject({ closedDeals: 0, missedSlots: 0, releasedCooldowns: 0 });
  });

  it('expires a follow-up into the campaign cool-down and frees the contact when it ends', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);

    await updateRecord(client, 'Campaign', scene.campaignId, { cooldownDays: 60 });

    const personId = await claimedContact(scene);
    const started = at(await openDealOf(personId), 1);
    const deal = await answered(scene, personId, started);
    const deadline = new Date(deal.deadlineAt).getTime();

    await sweepAt(new Date(deadline + GRACE_MS - 60_000));
    expect((await openDealOf(personId)).dealStage).toBe('IN_FOLLOW_UP');

    const closedAt = new Date(deadline + GRACE_MS + 60_000);

    await sweepAt(closedAt);

    const [closed] = await dealsOf(personId);
    const coolingDown = (await readPerson(personId)) as { lifecycleStage: string; ownerId: string | null };
    const [{ cooldownUntil }] = await listRecords<{ cooldownUntil: string }>(client, 'people', { id: { eq: personId } }, { cooldownUntil: true });

    expect(closed).toMatchObject({ dealStage: 'LOST', closeReason: 'EXPIRED' });
    expect(coolingDown).toMatchObject({ lifecycleStage: 'COOL_DOWN', ownerId: null });
    expect(cooldownUntil).toBe(new Date(closedAt.getTime() + 60 * DAY_MS).toISOString());

    await sweepAt(new Date(new Date(cooldownUntil).getTime() - 60_000));
    expect((await readPerson(personId)).lifecycleStage).toBe('COOL_DOWN');

    await sweepAt(new Date(new Date(cooldownUntil).getTime() + 60_000));
    expect(await readPerson(personId)).toMatchObject({ lifecycleStage: 'FREE' });
  });

  it('marks ended slot windows Missed and never touches a done or moved slot', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const personId = await claimedContact(scene);
    const first = at(await openDealOf(personId), 1);
    const deal = await answered(scene, personId, first);
    const anchor = new Date(deal.firstAnsweredCallAt!).getTime();

    await sweepAt(new Date(anchor + 4 * DAY_MS - 60_000));
    expect(await openDealOf(personId)).toMatchObject({ slot2Status: 'PENDING' });

    await sweepAt(new Date(anchor + 4 * DAY_MS + 60_000));
    expect(await openDealOf(personId)).toMatchObject({ slot1Status: 'DONE', slot2Status: 'MISSED', slot3Status: 'PENDING' });

    await sweepAt(new Date(anchor + 8 * DAY_MS + 60_000));
    expect(await openDealOf(personId)).toMatchObject({ slot3Status: 'MISSED', slot4Status: 'PENDING' });
  });

  it('moves urgency across the Tehran midnight and the two-hour mark', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    // 04:30 Tehran the day after opening: the whole Due window stays inside that Tehran day.
    const opened = new Date(deal.openedAt);
    const nextCallAt = new Date(Math.floor((opened.getTime() + TEHRAN_OFFSET_MS) / DAY_MS) * DAY_MS + DAY_MS + 4.5 * HOUR_MS - TEHRAN_OFFSET_MS);

    await log(scene.actors[0], personId, opened, { next: schedule(nextCallAt) });

    await sweepAt(new Date(nextCallAt.getTime() - HOUR_MS));
    expect((await readPerson(personId)).callUrgency).toBe('TODAY');

    await sweepAt(new Date(nextCallAt.getTime() + HOUR_MS));
    expect((await readPerson(personId)).callUrgency).toBe('DUE');

    await sweepAt(new Date(nextCallAt.getTime() + 2 * HOUR_MS + 60_000));
    expect((await readPerson(personId)).callUrgency).toBe('OVERDUE');
  });
});

describe('purchases', () => {
  it('wins a follow-up deal and credits 2% to the owner (CS1)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const personId = await claimedContact(scene);
    const deal = await answered(scene, personId, at(await openDealOf(personId), 1));

    expect(await buy(personId, at(deal, 3), '250.25')).toBe('processed');

    const [won] = await dealsOf(personId);
    const [purchase] = await purchasesOf(personId);

    expect(won).toMatchObject({ dealStage: 'WON' });
    expect(won.openDealKey ?? '').toBe('');
    expect(purchase).toMatchObject({ amountUsdt: 250.25, commissionUsdt: 5.01, creditedAgentId: actor.agentId, dealId: won.id });
    expect(await readPerson(personId)).toMatchObject({ lifecycleStage: 'CUSTOMER', ownerId: actor.agentId, nextCallAt: null, dealTypeLabel: 'Retention' });
  });

  it('voids the deal when the user bought before the first call (RS1)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);

    await buy(personId, at(deal, 1));

    const [voided] = await dealsOf(personId);
    const [purchase] = await purchasesOf(personId);

    expect(voided).toMatchObject({ dealStage: 'VOID', closeReason: 'PURCHASED_BEFORE_CALL' });
    expect(purchase).toMatchObject({ creditedAgentId: null, commissionUsdt: null });
    expect(await readPerson(personId)).toMatchObject({ lifecycleStage: 'FREE', ownerId: null });

    await loseAccount(personId, at(deal, 2));
    expect(await dealsOf(personId)).toHaveLength(1);
    expect((await readPerson(personId)).lifecycleStage).toBe('FREE');
  });

  it('attributes a Customer purchase to the owner without a deal, and ignores unowned stages', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const customer = await newCustomerOf(actor);
    const free = await newContact(scene.country);

    await buy(customer, new Date(), '100.00');
    await buy(free, new Date(), '100.00');

    expect(await purchasesOf(customer)).toMatchObject([{ creditedAgentId: actor.agentId, commissionUsdt: 2, dealId: null }]);
    expect(await purchasesOf(free)).toMatchObject([{ creditedAgentId: null, commissionUsdt: null }]);
    expect(await dealsOf(customer)).toEqual([]);
    expect((await readPerson(customer)).lifecycleStage).toBe('CUSTOMER');
    expect((await readPerson(free)).lifecycleStage).toBe('FREE');
  });

  it('stores a purchase at the deadline unattributed and lets the sweeper close the deal', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const personId = await claimedContact(scene);
    const deal = await answered(scene, personId, at(await openDealOf(personId), 1));

    await buy(personId, new Date(deal.deadlineAt));

    expect(await purchasesOf(personId)).toMatchObject([{ creditedAgentId: null, dealId: null }]);
    expect((await openDealOf(personId)).dealStage).toBe('IN_FOLLOW_UP');

    await sweepAt(new Date(new Date(deal.deadlineAt).getTime() + GRACE_MS + 60_000));
    expect((await dealsOf(personId))[0]).toMatchObject({ dealStage: 'LOST', closeReason: 'EXPIRED' });
  });

  it('applies a late purchase against current state and flags its inbox row', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const personId = await claimedContact(scene);
    const deal = await answered(scene, personId, at(await openDealOf(personId), 1));
    const deadline = new Date(deal.deadlineAt);

    await sweepAt(new Date(deadline.getTime() + GRACE_MS + 60_000));

    const event = platformEvent('purchase.settled', new Date(deadline.getTime() - 60_000), {
      platformPurchaseId: `p_${randomUUID()}`,
      platformUserId: await platformUserIdOf(personId),
      amountUsdt: '80.00',
      codeUsed: null,
    });
    const inboxId = await track(
      'PlatformEventInbox',
      createRecord(client, 'PlatformEventInbox', {
        eventId: event.eventId,
        eventType: event.type,
        platformUserId: String(event.data.platformUserId),
        occurredAt: event.occurredAt,
        payload: event,
        status: 'RECEIVED',
        attempts: 0,
      }),
    );

    await sweepAt(new Date(deadline.getTime() + GRACE_MS + 2 * 60_000));

    const [row] = await listRecords<{ status: string; needsReview: boolean }>(client, 'platformEventInboxes', { id: { eq: inboxId } }, { status: true, needsReview: true });

    expect(row).toMatchObject({ status: 'PROCESSED', needsReview: true });
    expect((await dealsOf(personId))[0].dealStage).toBe('LOST');
    expect(await purchasesOf(personId)).toMatchObject([{ creditedAgentId: null }]);
  });

  it('waits for an unknown contact', async () => {
    const event = platformEvent('purchase.settled', new Date(), {
      platformPurchaseId: `p_${randomUUID()}`,
      platformUserId: `u_${randomUUID()}`,
      amountUsdt: '10.00',
      codeUsed: null,
    });

    expect(await processPurchase(client, event, new Date())).toBe('waiting');
  });
});

describe('rebuy (S5, S6, S7, S10, U2, SL1)', () => {
  const lostAt = () => new Date(Date.now() - HOUR_MS);

  it('opens a 72h rebuy window for a Customer, hides it from the pool, and abandons it unanswered (S5)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const customer = await newCustomerOf(actor);
    const occurredAt = lostAt();

    expect(await loseAccount(customer, occurredAt)).toBe('processed');
    expect(await loseAccount(customer, occurredAt)).toBe('processed');

    const [deal] = await dealsOf(customer);

    expect(deal).toMatchObject({ dealType: 'REBUY', dealStage: 'REBUY_WINDOW', openDealKey: customer, agentId: actor.agentId, sourceCampaignId: null });
    expect(deal.deadlineAt).toBe(new Date(occurredAt.getTime() + 72 * HOUR_MS).toISOString());
    expect(await dealsOf(customer)).toHaveLength(1);
    expect(await readPerson(customer)).toMatchObject({ lifecycleStage: 'REBUY_WINDOW', ownerId: actor.agentId, dealTypeLabel: 'Rebuy', planProgress: '72h left' });

    await sweepAt(new Date(new Date(deal.deadlineAt).getTime() + GRACE_MS + 60_000));

    expect((await dealsOf(customer))[0]).toMatchObject({ dealStage: 'LOST', closeReason: 'ABANDONED_IN_72H' });
    expect(await readPerson(customer)).toMatchObject({ lifecycleStage: 'FREE', ownerId: null });
  });

  it('wins the rebuy deal when the owner has not added it yet and returns the user to Customer (U2)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const customer = await newCustomerOf(actor);
    const occurredAt = lostAt();

    await loseAccount(customer, occurredAt);
    await buy(customer, new Date(occurredAt.getTime() + HOUR_MS), '300.00');

    expect((await dealsOf(customer))[0]).toMatchObject({ dealType: 'REBUY', dealStage: 'WON' });
    expect(await purchasesOf(customer)).toMatchObject([{ commissionUsdt: 6, creditedAgentId: actor.agentId }]);
    expect(await readPerson(customer)).toMatchObject({ lifecycleStage: 'CUSTOMER', ownerId: actor.agentId });
  });

  it('cools a rebuy follow-up down for the global rebuy days, not the campaign days (S10, SL1)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;

    await updateRecord(client, 'Campaign', scene.campaignId, { cooldownDays: 60 });

    const [settings] = await listRecords<{ id: string; rebuyFollowUpDays: number }>(client, 'proopcoSettingsRecords', {}, { rebuyFollowUpDays: true }, 1);

    await updateRecord(client, 'ProopcoSettings', settings.id, { rebuyFollowUpDays: 45 });

    try {
      const customer = await newCustomerOf(actor);

      await loseAccount(customer, lostAt());
      await claimNow(actor, customer);

      const deal = await openDealOf(customer);
      const added = new Date(deal.deadlineAt).getTime() - 45 * DAY_MS;

      expect(deal).toMatchObject({ dealType: 'REBUY', dealStage: 'IN_FOLLOW_UP' });
      expect(added).toBeGreaterThan(Date.now() - DAY_MS);

      const closedAt = new Date(new Date(deal.deadlineAt).getTime() + GRACE_MS + 60_000);

      await sweepAt(closedAt);

      const [{ cooldownUntil }] = await listRecords<{ cooldownUntil: string }>(client, 'people', { id: { eq: customer } }, { cooldownUntil: true });

      expect((await dealsOf(customer))[0]).toMatchObject({ dealStage: 'LOST', closeReason: 'EXPIRED' });
      expect(cooldownUntil).toBe(new Date(closedAt.getTime() + 30 * DAY_MS).toISOString());
    } finally {
      await updateRecord(client, 'ProopcoSettings', settings.id, { rebuyFollowUpDays: settings.rebuyFollowUpDays });
    }
  });

  it('ignores a lost account for users who are not Customers (S7)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const personId = await newContact(scene.country);

    await updateRecord(client, 'Person', personId, { lifecycleStage: 'DO_NOT_CONTACT', eligibleMemberIds: [] });
    await loseAccount(personId, lostAt());
    await buy(personId, lostAt());

    expect(await dealsOf(personId)).toEqual([]);
    expect((await readPerson(personId)).lifecycleStage).toBe('DO_NOT_CONTACT');
  });
});

describe('Codes and SMS (DS1-DS6, RS2)', () => {
  type PlatformBody = Record<string, unknown> | undefined;
  type Script = (request: StubRequest<PlatformBody>) => StubResponse;

  const okScript: Script = ({ url }) =>
    url === '/codes'
      ? { status: 201, body: { platformCodeId: `c_${randomUUID()}` } }
      : url.endsWith('/activations')
        ? { status: 200, body: { activatedAt: new Date().toISOString() } }
        : url === '/sms'
          ? { status: 202, body: { messageId: 'm_1' } }
          : { status: 200, body: { deactivatedAt: new Date().toISOString() } };
  let script: Script = okScript;
  let stub: Awaited<ReturnType<typeof startStubServer<PlatformBody>>>;
  let platform: ReturnType<typeof createPlatformClient>;

  beforeAll(async () => {
    stub = await startStubServer<PlatformBody>((request) => script(request));
    platform = createPlatformClient({ baseUrl: stub.url, token: TEST_PLATFORM_TOKEN, timeoutMs: 400 });
  });

  afterAll(() => stub.stop());

  afterEach(() => {
    script = okScript;
    stub.requests.length = 0;
  });

  const inDays = (days: number) => new Date(Date.now() + days * DAY_MS);

  const newCode = async (options: { capability?: string; inRebuySet?: boolean; inRetentionSet?: boolean; campaignId?: string } = {}) => {
    const { id } = await createDiscountCode(
      client,
      platform,
      {
        code: `T${randomUUID().slice(0, 8).toUpperCase()}`,
        capability: options.capability ?? 'RESET',
        expiresAt: inDays(30).toISOString(),
        inRebuySet: options.inRebuySet,
        inRetentionSet: options.inRetentionSet,
      },
      new Date(),
    );

    await track('DiscountCode', id);

    if (options.campaignId) {
      await track('CampaignCode', createRecord(client, 'CampaignCode', { name: 'link', campaignId: options.campaignId, codeId: id }));
    }

    return id;
  };

  const codeOf = async (id: string) =>
    (await listRecords<{ code: string; isActive: boolean; deactivatedAt: string | null; expiresAt: string; platformCodeId: string }>(
      client,
      'discountCodes',
      { id: { eq: id } },
      { code: true, isActive: true, deactivatedAt: true, expiresAt: true, platformCodeId: true },
    ))[0];

  const activationsOf = (personId: string) =>
    listRecords<{
      id: string;
      status: string;
      smsStatus: string;
      lastError: string | null;
      activatingAgentId: string;
      contactOwnerId: string | null;
      callId: string | null;
      dealId: string | null;
      codeId: string;
      usedAt: string | null;
    }>(client, 'codeActivations', { contactId: { eq: personId } }, {
      status: true,
      smsStatus: true,
      lastError: true,
      activatingAgentId: true,
      contactOwnerId: true,
      callId: true,
      dealId: true,
      codeId: true,
      usedAt: true,
    });

  // An answered call that continues, with the given codes ticked.
  const answerWithCodes = async (actor: AgentActor, personId: string, now: Date, codeIds: string[]) => {
    const [reasonId] = await dissatisfactionReasonIds(1);

    return logCall(
      client,
      actor,
      {
        personId,
        idempotencyKey: `test-${(callCounter += 1)}-${randomUUID()}`,
        technicalStatus: 'ANSWERED',
        reasonIds: [reasonId],
        next: schedule(new Date(now.getTime() + DAY_MS)),
        codeIds,
      },
      now,
      platform,
    );
  };

  const callsTo = (suffix: string) => stub.requests.filter(({ url }) => url.endsWith(suffix));

  const callerOf = (actor: AgentActor) => ({ isStaff: false, agentId: actor.agentId });

  it('activates a ticked code on save and sends the SMS from the template (DS1)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    const codeId = await newCode({ campaignId: scene.campaignId });
    const code = await codeOf(codeId);
    const now = at(deal, 0, 2);

    expect((await prepareCall(client, actor, personId, now)).codes).toMatchObject([{ id: codeId, activated: false }]);

    const result = await answerWithCodes(actor, personId, now, [codeId]);
    const [activation] = await activationsOf(personId);

    expect(result.activations).toMatchObject([{ codeId, status: 'ACTIVE', smsStatus: 'SENT' }]);
    expect(activation).toMatchObject({
      status: 'ACTIVE',
      smsStatus: 'SENT',
      activatingAgentId: actor.agentId,
      contactOwnerId: actor.agentId,
      callId: result.callId,
      dealId: deal.id,
    });

    const [activate] = callsTo('/activations');
    const [sms] = callsTo('/sms');

    expect(activate.url).toBe(`/codes/${code.platformCodeId}/activations`);
    expect(activate.headers['idempotency-key']).toBe(activation.id);
    expect(activate.headers.authorization).toBe(`Bearer ${TEST_PLATFORM_TOKEN}`);
    expect(activate.body).toEqual({ platformUserId: await platformUserIdOf(personId) });
    expect(sms.body).toMatchObject({ platformUserId: await platformUserIdOf(personId) });
    expect(String(sms.body?.text)).toContain(code.code);
    expect(String(sms.body?.text)).toContain('Reset');
    expect(String(sms.body?.text)).toContain(formatJalaliTehranDateTime(new Date(code.expiresAt)));
  });

  it('shows an activated code as taken, hides expired ones and refuses a second activation (DS2)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    const reset = await newCode({ campaignId: scene.campaignId });
    const expired = await newCode({ campaignId: scene.campaignId });
    const now = at(deal, 0, 2);

    await updateRecord(client, 'DiscountCode', expired, { expiresAt: new Date(Date.now() - HOUR_MS).toISOString() });
    await answerWithCodes(actor, personId, now, [reset]);

    const prepared = await prepareCall(client, actor, personId, at(deal, 1));

    expect(prepared.codes).toMatchObject([{ id: reset, activated: true }]);
    expect((await refusalOf(answerWithCodes(actor, personId, at(deal, 1), [reset]))).code).toBe('CODE_NOT_AVAILABLE');
    expect((await refusalOf(answerWithCodes(actor, personId, at(deal, 1), [expired]))).code).toBe('CODE_NOT_AVAILABLE');
    expect(await activationsOf(personId)).toHaveLength(1);
    expect(callsTo('/activations')).toHaveLength(1);
  });

  it('offers the set of the deal type and hides the step when the set is empty (DS3)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const campaignCode = await newCode({ campaignId: scene.campaignId });
    const rebuyCode = await newCode({ inRebuySet: true });
    const retentionCode = await newCode({ inRetentionSet: true });
    const idsOf = (offered: { id: string }[]) => offered.map(({ id }) => id).filter((id) => [campaignCode, rebuyCode, retentionCode].includes(id));
    const campaignContact = await claimedContact(scene);
    const customer = await newCustomerOf(actor);
    const now = new Date();

    expect(idsOf((await prepareCall(client, actor, campaignContact, now)).codes)).toEqual([campaignCode]);
    expect(idsOf((await prepareCall(client, actor, customer, now)).codes)).toEqual([retentionCode]);
    expect(
      idsOf(await loadOfferedCodes(client, { kind: 'FOLLOW_UP', deal: { dealType: 'REBUY', sourceCampaignId: null }, personId: customer, now })),
    ).toEqual([rebuyCode]);

    const emptyScene = await setUpScene([memberIdOf(SCOTT)]);
    const emptyContact = await claimedContact(emptyScene);

    expect((await prepareCall(client, emptyScene.actors[0], emptyContact, now)).codes).toEqual([]);
  });

  it('keeps the call when the platform fails or times out and retries the same row with the same key (DS4a)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    const codeId = await newCode({ campaignId: scene.campaignId });
    const now = at(deal, 0, 2);

    script = ({ url }) =>
      url.endsWith('/activations') ? { status: 200, body: {}, delayMs: 1_500 } : okScript({ url } as StubRequest<PlatformBody>);

    const result = await answerWithCodes(actor, personId, now, [codeId]);
    const [failed] = await activationsOf(personId);

    expect(result.activations[0]).toMatchObject({ status: 'FAILED', smsStatus: 'NOT_SENT' });
    expect(await callsOf(personId)).toHaveLength(1);
    expect(failed).toMatchObject({ status: 'FAILED', smsStatus: 'NOT_SENT' });
    expect(failed.lastError).toBeTruthy();
    expect(callsTo('/sms')).toHaveLength(0);

    script = okScript;

    const retried = await retryActivation(client, platform, failed.id, callerOf(actor), now);
    const [after] = await activationsOf(personId);

    expect(retried).toMatchObject({ status: 'ACTIVE', smsStatus: 'SENT' });
    expect(after).toMatchObject({ id: failed.id, status: 'ACTIVE', smsStatus: 'SENT' });
    expect(after.lastError ?? '').toBe('');
    expect(callsTo('/activations').map(({ headers }) => headers['idempotency-key'])).toEqual([failed.id, failed.id]);
    expect((await refusalOf(retryActivation(client, platform, failed.id, callerOf(actor), now))).code).toBe('NOT_FAILED');
  });

  it('refuses to create a code when the platform create fails (DS4a)', async () => {
    script = () => ({ status: 409, body: { error: { code: 'CODE_TAKEN', message: 'taken' } } });

    const code = `T${randomUUID().slice(0, 8)}`;
    const refusal = await refusalOf(
      createDiscountCode(client, platform, { code, capability: 'DISCOUNT', expiresAt: inDays(5).toISOString() }, new Date()),
    );

    expect(refusal.status).toBe(409);
    expect(await listRecords(client, 'discountCodes', { code: { eq: code } }, {})).toEqual([]);
  });

  it('keeps the code active when only the SMS fails and resends it with the right permissions (DS4b)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL), memberIdOf(SCOTT)]);
    const [actor, other] = scene.actors;
    const personId = await claimedContact(scene);
    const deal = await openDealOf(personId);
    const codeId = await newCode({ campaignId: scene.campaignId });
    const now = at(deal, 0, 2);

    script = ({ url }) => (url === '/sms' ? { status: 422, body: { error: { code: 'NO_PHONE', message: 'no phone' } } } : okScript({ url } as StubRequest<PlatformBody>));

    const result = await answerWithCodes(actor, personId, now, [codeId]);
    const [activation] = await activationsOf(personId);

    expect(result.activations[0]).toMatchObject({ status: 'ACTIVE', smsStatus: 'FAILED' });
    expect(activation).toMatchObject({ status: 'ACTIVE', smsStatus: 'FAILED' });

    script = okScript;

    expect((await refusalOf(resendSms(client, platform, activation.id, callerOf(other), now))).code).toBe('NOT_ALLOWED');
    expect(await resendSms(client, platform, activation.id, { isStaff: true, agentId: null }, now)).toEqual({ smsStatus: 'SENT' });
    expect((await activationsOf(personId))[0]).toMatchObject({ status: 'ACTIVE', smsStatus: 'SENT' });
    expect((await refusalOf(retryActivation(client, platform, activation.id, callerOf(actor), now))).code).toBe('NOT_FAILED');

    await updateRecord(client, 'Person', personId, { lifecycleStage: 'DO_NOT_CONTACT' });
    expect((await refusalOf(resendSms(client, platform, activation.id, callerOf(actor), now))).code).toBe('CONTACT_DO_NOT_CONTACT');
  });

  it('deactivates a code on the platform first, then for every activated user, with an audit row and no SMS (DS5, DS6)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const codeId = await newCode({ campaignId: scene.campaignId });
    const contacts = [await claimedContact(scene), await claimedContact(scene), await claimedContact(scene)];

    for (const personId of contacts) {
      await answerWithCodes(actor, personId, at(await openDealOf(personId), 0, 2), [codeId]);
    }

    const smsBefore = callsTo('/sms').length;

    script = ({ url }) => (url.endsWith('/deactivate') ? { status: 500, body: { error: { code: 'DOWN', message: 'down' } } } : okScript({ url } as StubRequest<PlatformBody>));
    await refusalOf(deactivateDiscountCode(client, platform, { codeId, actorName: 'Admin' }, new Date()));

    expect(await codeOf(codeId)).toMatchObject({ isActive: true, deactivatedAt: null });
    expect((await Promise.all(contacts.map(activationsOf))).flat().map(({ status }) => status)).toEqual(['ACTIVE', 'ACTIVE', 'ACTIVE']);
    expect(await listRecords(client, 'auditLogs', { discountCodeId: { eq: codeId } }, {})).toEqual([]);

    script = okScript;

    expect(await deactivateDiscountCode(client, platform, { codeId, actorName: 'Admin' }, new Date())).toEqual({ deactivatedActivations: 3 });

    const code = await codeOf(codeId);
    const audits = await listRecords<{ id: string; action: string; status: string; actorName: string }>(
      client,
      'auditLogs',
      { discountCodeId: { eq: codeId } },
      { action: true, status: true, actorName: true },
    );

    for (const audit of audits) {
      created.push({ singular: 'AuditLog', id: audit.id });
    }

    expect(code.isActive).toBe(false);
    expect(code.deactivatedAt).toBeTruthy();
    expect(audits).toMatchObject([{ action: 'CODE_DEACTIVATED', status: 'DONE', actorName: 'Admin' }]);
    expect((await Promise.all(contacts.map(activationsOf))).flat().map(({ status }) => status)).toEqual(['DEACTIVATED', 'DEACTIVATED', 'DEACTIVATED']);
    expect(callsTo('/sms')).toHaveLength(smsBefore);
    expect((await readPerson(contacts[0])).lifecycleStage).toBe('IN_FOLLOW_UP');
    expect((await prepareCall(client, actor, contacts[0], new Date())).codes).toEqual([]);
    expect((await refusalOf(deactivateDiscountCode(client, platform, { codeId, actorName: 'Admin' }, new Date()))).code).toBe('ALREADY_DEACTIVATED');
  });

  it('credits the owner at purchase and the activating agent for the code used (RS2)', async () => {
    const scene = await setUpScene([memberIdOf(PHIL), memberIdOf(SCOTT)]);
    const [agentA, agentB] = scene.actors;
    const personId = await claimedContact(scene, agentA);
    const deal = await openDealOf(personId);
    const codeId = await newCode({ campaignId: scene.campaignId });
    const code = await codeOf(codeId);

    await answerWithCodes(agentA, personId, at(deal, 0, 2), [codeId]);
    // A transfer (built in a later ticket) moves the contact and its open deal to B.
    await updateRecord(client, 'Person', personId, { ownerId: agentB.agentId, ownerMemberId: agentB.memberId });
    await updateRecord(client, 'Opportunity', deal.id, { agentId: agentB.agentId });

    const occurredAt = at(deal, 2);

    await processPurchase(
      client,
      platformEvent('purchase.settled', occurredAt, {
        platformPurchaseId: `p_${randomUUID()}`,
        platformUserId: await platformUserIdOf(personId),
        amountUsdt: '200.00',
        codeUsed: code.code,
      }),
      occurredAt,
    );

    const [purchase] = await listRecords<{ creditedAgentId: string | null; codeId: string | null; codeText: string | null; commissionUsdt: number }>(
      client,
      'purchases',
      { contactId: { eq: personId } },
      { creditedAgentId: true, codeId: true, codeText: true, commissionUsdt: true },
    );
    const [activation] = await activationsOf(personId);

    expect(purchase).toMatchObject({ creditedAgentId: agentB.agentId, codeId, codeText: code.code, commissionUsdt: 4 });
    expect(activation).toMatchObject({ status: 'USED', activatingAgentId: agentA.agentId });
    expect(activation.usedAt).toBe(occurredAt.toISOString());
  });

  it('fails an activation stuck in Pending for more than five minutes in the sweeper', async () => {
    const scene = await setUpScene([memberIdOf(PHIL)]);
    const [actor] = scene.actors;
    const personId = await claimedContact(scene);
    const codeId = await newCode({ campaignId: scene.campaignId });
    const id = await createRecord(client, 'CodeActivation', {
      name: 'stuck',
      activationKey: `${codeId}:${personId}`,
      codeId,
      contactId: personId,
      activatingAgentId: actor.agentId,
      status: 'PENDING',
    });

    expect(await failStalePendingActivations(client, new Date(Date.now() + 4 * 60_000))).toBe(0);
    expect((await activationsOf(personId))[0].status).toBe('PENDING');
    expect((await sweepAt(new Date(Date.now() + 6 * 60_000))).failedActivations).toBe(1);
    expect((await activationsOf(personId))[0]).toMatchObject({ status: 'FAILED' });
    expect((await activationsOf(personId))[0].lastError).toBeTruthy();
    expect(id).toBeTruthy();
  });
});

describe('Seeds', () => {
  it('installs the Persian reasons on first install', async () => {
    const reasons = await listRecords<{ kind: string; name: string }>(client, 'reasons', {}, { kind: true, name: true });

    expect(reasons.filter(({ kind }) => kind === 'DISSATISFACTION').length).toBeGreaterThanOrEqual(6);
    expect(reasons.filter(({ kind }) => kind === 'DO_NOT_CONTACT').length).toBeGreaterThanOrEqual(3);
    expect(reasons.filter(({ kind }) => kind === 'SATISFACTION')).toHaveLength(0);
  });
});

