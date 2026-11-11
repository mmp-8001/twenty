import { execFileSync } from 'child_process';
import { randomUUID } from 'crypto';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { DAY_MS, HOUR_MS } from 'src/constants/time.constant';
import { AGENT_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { runSweeper } from 'src/logic-functions/platform-event-sweeper';
import { type AgentActor } from 'src/logic-functions/utils/agent-actor.util';
import { claimContact } from 'src/logic-functions/utils/claim-contact.util';
import {
  loadEligibilityPlan,
  recomputeContactEligibility,
} from 'src/logic-functions/utils/eligibility.util';
import { logCall, type LogCallInput } from 'src/logic-functions/utils/log-call.util';
import { prepareCall } from 'src/logic-functions/utils/prepare-call.util';
import {
  createRecord,
  listRecords,
  updateRecord,
} from 'src/logic-functions/utils/records.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';
import { runEligibilityRefresh } from 'src/logic-functions/utils/refresh-eligibility.util';

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

describe('Seeds', () => {
  it('installs the Persian reasons on first install', async () => {
    const reasons = await listRecords<{ kind: string; name: string }>(client, 'reasons', {}, { kind: true, name: true });

    expect(reasons.filter(({ kind }) => kind === 'DISSATISFACTION').length).toBeGreaterThanOrEqual(6);
    expect(reasons.filter(({ kind }) => kind === 'DO_NOT_CONTACT').length).toBeGreaterThanOrEqual(3);
    expect(reasons.filter(({ kind }) => kind === 'SATISFACTION')).toHaveLength(0);
  });
});

