import { randomUUID } from 'crypto';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { DAY_MS, HOUR_MS } from 'src/constants/time.constant';
import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { runSweeper } from 'src/logic-functions/platform-event-sweeper';
import { loadAgentActor, type AgentActor } from 'src/logic-functions/utils/agent-actor.util';
import { deactivateAgent, flagRoleMismatches, reactivateAgent } from 'src/logic-functions/utils/agent-lifecycle.util';
import { loadAudit, runAudit, type AuditContext } from 'src/logic-functions/utils/audit-log.util';
import { claimContact } from 'src/logic-functions/utils/claim-contact.util';
import { closeExpiredDeals } from 'src/logic-functions/utils/close-expired-deals.util';
import { editCallNote } from 'src/logic-functions/utils/edit-call-note.util';
import { loadEligibilityPlan, recomputeContactEligibility } from 'src/logic-functions/utils/eligibility.util';
import {
  FREEZE_EXECUTORS,
  freezeAgent,
  refreshFreezePeriods,
  unfreezeAgent,
} from 'src/logic-functions/utils/freeze-agent.util';
import { logCall } from 'src/logic-functions/utils/log-call.util';
import { type PlatformEvent } from 'src/logic-functions/utils/parse-platform-envelope.util';
import { processAccountLastLost } from 'src/logic-functions/utils/process-last-lost.util';
import { reconcileClaims } from 'src/logic-functions/utils/reconcile-claims.util';
import { createRecord, listRecords, updateRecord } from 'src/logic-functions/utils/records.util';
import { runEligibilityRefresh } from 'src/logic-functions/utils/refresh-eligibility.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';
import { resumeAudits } from 'src/logic-functions/utils/resume-audits.util';
import { releaseContacts, transferContacts } from 'src/logic-functions/utils/transfer-contacts.util';
import { FROZEN_PLAN_PROGRESS } from 'src/utils/deal-clock.util';

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
import { assignRole, listRoles } from './user-session';

const client = new CoreApiClient();
const metadata = new MetadataApiClient();
const context: AuditContext = { client, metadata };
const PHIL = 'phil.schiler@apple.dev';
const SCOTT = 'scott.forstall@apple.dev';
const JONY = 'jony.ive@apple.dev';
const JANE = 'jane.austen@apple.dev';

const created: { singular: string; id: string }[] = [];
const viewIds: string[] = [];
const linkedMemberIds: string[] = [];
let members: { id: string; userEmail: string }[] = [];

const track = async (singular: string, id: Promise<string> | string) => {
  const resolved = await id;

  created.push({ singular, id: resolved });

  return resolved;
};

const memberIdOf = (email: string) => members.find(({ userEmail }) => userEmail === email)!.id;

// A staff caller as the route would resolve it.
const staff = (email: string, role: string, agentId: string | null = null) => ({
  memberId: memberIdOf(email),
  name: email,
  roles: [role],
  agentId,
});
const supervisorCaller = (agentId: string | null = null) => staff(JONY, SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER, agentId);
const fullAdminCaller = () => staff(JANE, FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER);

const setUpScene = async (memberEmails: string[]) => {
  const country = `OP-${randomUUID()}`;
  const viewId = await createSegmentView([{ fieldName: 'country', operand: 'CONTAINS', value: country }]);

  viewIds.push(viewId);

  const segmentId = await track('Segment', createSegment(client, viewId));
  const campaignId = await track('Campaign', createCampaign(client, { startsAt: '2026-01-01' }));

  await track('CampaignSegment', addSegmentToCampaign(client, campaignId, segmentId));

  const actors: AgentActor[] = [];

  for (const email of memberEmails) {
    const memberId = memberIdOf(email);
    const agentId = await track('Agent', createAgent(client, `Agent ${randomUUID()}`));

    await linkMemberToAgent(client, memberId, agentId);
    linkedMemberIds.push(memberId);
    await track('CampaignAgent', addAgentToCampaign(client, campaignId, agentId));
    actors.push({ memberId, agentId, name: agentId });
  }

  await runEligibilityRefresh(new Date(), client, metadata);

  return { country, actors };
};

const claimedContact = async (country: string, actor: AgentActor) => {
  const personId = await track(
    'Person',
    createRecord(client, 'Person', {
      name: { firstName: 'Op', lastName: randomUUID().slice(0, 8) },
      platformUserId: `u_${randomUUID()}`,
      country,
    }),
  );

  await recomputeContactEligibility(client, await loadEligibilityPlan(client, metadata), personId);

  const { dealId } = await claimContact({ client, metadata, actor, personId, now: new Date() });

  created.push({ singular: 'Opportunity', id: dealId });

  return personId;
};

const answer = (actor: AgentActor, personId: string, now: Date, note?: string) =>
  logCall(
    client,
    actor,
    {
      personId,
      idempotencyKey: `op-${randomUUID()}`,
      technicalStatus: 'ANSWERED',
      reasonIds: [],
      otherReasonText: 'asked about price',
      note,
      next: { mode: 'schedule', at: new Date(now.getTime() + 2 * DAY_MS).toISOString() },
    },
    now,
  );

type DealRow = {
  id: string;
  dealStage: string;
  closeReason: string | null;
  openDealKey: string | null;
  openedAt: string;
  deadlineAt: string;
  firstAnsweredCallAt: string | null;
  frozenMs: number | null;
  agentId: string;
  contactOwnerId: string | null;
  slot1Status: string;
  lastFreezeShiftId: string | null;
};

const DEAL_FIELDS = {
  dealStage: true,
  closeReason: true,
  openDealKey: true,
  openedAt: true,
  deadlineAt: true,
  firstAnsweredCallAt: true,
  frozenMs: true,
  agentId: true,
  contactOwnerId: true,
  slot1Status: true,
  lastFreezeShiftId: true,
};

const dealsOf = (personId: string) =>
  listRecords<DealRow>(client, 'opportunities', { pointOfContactId: { eq: personId } }, DEAL_FIELDS);

const openDealOf = async (personId: string) => (await dealsOf(personId)).find(({ openDealKey }) => openDealKey)!;

const readPerson = async (personId: string) =>
  (
    await listRecords<{
      lifecycleStage: string;
      ownerId: string | null;
      ownerMemberId: string | null;
      cooldownUntil: string | null;
      planProgress: string | null;
      deadlineAt: string | null;
      nextCallAt: string | null;
      eligibleMemberIds: string[] | null;
    }>(
      client,
      'people',
      { id: { eq: personId } },
      { lifecycleStage: true, ownerId: true, ownerMemberId: true, cooldownUntil: true, planProgress: true, deadlineAt: true, nextCallAt: true, eligibleMemberIds: true },
      1,
    )
  )[0];

const readAgent = async (agentId: string) =>
  (
    await listRecords<{ isActive: boolean; frozenSince: string | null; ownedContactCount: number }>(
      client,
      'agents',
      { id: { eq: agentId } },
      { isActive: true, frozenSince: true, ownedContactCount: true },
      1,
    )
  )[0];

const auditsOf = (filter: Record<string, unknown>) =>
  listRecords<{
    id: string;
    action: string;
    status: string;
    reason: string | null;
    actorName: string | null;
    attempts: number;
    lastError: string | null;
    needsReview: boolean;
    contactId: string | null;
    fromAgentId: string | null;
    toAgentId: string | null;
    newDealId: string | null;
    closedDealId: string | null;
    freezePeriodId: string | null;
    details: Record<string, unknown> | null;
  }>(client, 'auditLogs', filter, {
    action: true,
    status: true,
    reason: true,
    actorName: true,
    attempts: true,
    lastError: true,
    needsReview: true,
    contactId: true,
    fromAgentId: true,
    toAgentId: true,
    newDealId: true,
    closedDealId: true,
    freezePeriodId: true,
    details: true,
  });

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

const trackAudits = async (filter: Record<string, unknown>) => {
  for (const { id } of await listRecords<{ id: string }>(client, 'auditLogs', filter, {})) {
    created.push({ singular: 'AuditLog', id });
  }
};

afterEach(async () => {
  try {
    await assertInvariants(client);
  } finally {
    await cleanUp();
  }
});

const cleanUp = async () => {
  for (const id of linkedMemberIds.splice(0)) {
    await linkMemberToAgent(client, id, null);
  }

  for (const agent of created.filter(({ singular }) => singular === 'Agent')) {
    await trackAudits({ or: [{ subjectAgentId: { eq: agent.id } }, { fromAgentId: { eq: agent.id } }, { toAgentId: { eq: agent.id } }] });

    for (const { id } of await listRecords<{ id: string }>(client, 'freezePeriods', { agentId: { eq: agent.id } }, {})) {
      created.push({ singular: 'FreezePeriod', id });
    }
  }

  for (const { id } of created.filter(({ singular }) => singular === 'Person')) {
    await trackAudits({ contactId: { eq: id } });

    for (const [collection, singular] of [['opportunities', 'Opportunity'], ['calls', 'Call']] as const) {
      const field = collection === 'opportunities' ? 'pointOfContactId' : 'contactId';

      for (const row of await listRecords<{ id: string }>(client, collection, { [field]: { eq: id } }, {})) {
        created.push({ singular, id: row.id });
      }
    }
  }

  for (const { singular, id } of [...new Map(created.splice(0).map((entry) => [entry.id, entry])).values()].reverse()) {
    await softDelete(client, singular, id).catch(() => undefined);
  }

  for (const id of viewIds.splice(0)) {
    await deleteView(id);
  }
};

const previousRoleIdByMemberId = new Map<string, string>();

// Targets of a transfer need the Agent or Supervisor role; the previous roles come back afterwards.
beforeAll(async () => {
  members = await listMembers(client);

  const roles = await listRoles();
  const roleId = (universalIdentifier: string) => roles.find((role) => role.universalIdentifier === universalIdentifier)!.id;

  for (const [email, role] of [
    [PHIL, AGENT_ROLE_UNIVERSAL_IDENTIFIER],
    [SCOTT, AGENT_ROLE_UNIVERSAL_IDENTIFIER],
    [JONY, SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER],
  ]) {
    const memberId = memberIdOf(email);

    previousRoleIdByMemberId.set(memberId, roles.find(({ workspaceMembers }) => workspaceMembers.some(({ id }) => id === memberId))!.id);
    await assignRole(memberId, roleId(role));
  }
});

afterAll(async () => {
  for (const [memberId, roleId] of previousRoleIdByMemberId) {
    await assignRole(memberId, roleId);
  }
});

describe('transfer and release (S11)', () => {
  it('moves one contact with its clock, history and audit row, leaving the old deal Void', async () => {
    const { country, actors } = await setUpScene([PHIL, SCOTT]);
    const [agentA, agentB] = actors;
    const q = await claimedContact(country, agentA);
    const opened = new Date((await openDealOf(q)).openedAt);

    await answer(agentA, q, opened, 'first call');

    const before = await openDealOf(q);
    const day12 = new Date(new Date(before.firstAnsweredCallAt!).getTime() + 12 * DAY_MS);
    const result = await transferContacts(context, {
      caller: supervisorCaller(),
      personIds: [q],
      toAgentId: agentB.agentId,
      reason: 'Agent A is overloaded',
      now: day12,
    });

    expect(result).toEqual({ succeeded: [q], failed: [] });

    const deals = await dealsOf(q);
    const old = deals.find(({ id }) => id === before.id)!;
    const next = deals.find(({ openDealKey }) => openDealKey)!;

    expect(old).toMatchObject({ dealStage: 'VOID', closeReason: 'TRANSFERRED', openDealKey: '' });
    expect(next).toMatchObject({ agentId: agentB.agentId, dealStage: 'IN_FOLLOW_UP', slot1Status: 'DONE' });
    expect(next.deadlineAt).toBe(before.deadlineAt);
    expect(next.firstAnsweredCallAt).toBe(before.firstAnsweredCallAt);
    expect(new Date(next.deadlineAt).getTime() - day12.getTime()).toBe(18 * DAY_MS);
    expect(await readPerson(q)).toMatchObject({ ownerId: agentB.agentId, ownerMemberId: agentB.memberId });

    const [call] = await listRecords<{ contactOwnerId: string; contactOwnerMemberId: string }>(
      client,
      'calls',
      { contactId: { eq: q } },
      { contactOwnerId: true, contactOwnerMemberId: true },
    );

    expect(call).toMatchObject({ contactOwnerId: agentB.agentId, contactOwnerMemberId: agentB.memberId });
    expect([(await readAgent(agentA.agentId)).ownedContactCount, (await readAgent(agentB.agentId)).ownedContactCount]).toEqual([0, 1]);

    const [audit] = await auditsOf({ contactId: { eq: q } });

    expect(audit).toMatchObject({
      action: 'TRANSFER',
      status: 'DONE',
      reason: 'Agent A is overloaded',
      actorName: JONY,
      fromAgentId: agentA.agentId,
      toAgentId: agentB.agentId,
      newDealId: next.id,
      closedDealId: before.id,
    });
  });

  it('refuses a missing reason, a bad target and a finished follow-up, per contact', async () => {
    const { country, actors } = await setUpScene([PHIL, SCOTT]);
    const [agentA, agentB] = actors;
    const q = await claimedContact(country, agentA);

    expect((await refusalOf(transferContacts(context, { caller: supervisorCaller(), personIds: [q], toAgentId: agentB.agentId, reason: '  ', now: new Date() }))).code).toBe('REASON_REQUIRED');
    expect((await refusalOf(transferContacts(context, { caller: supervisorCaller(), personIds: [], toAgentId: agentB.agentId, reason: 'x', now: new Date() }))).code).toBe('INVALID_SELECTION');

    const same = await transferContacts(context, { caller: supervisorCaller(), personIds: [q], toAgentId: agentA.agentId, reason: 'x', now: new Date() });

    expect(same.failed[0].code).toBe('ALREADY_OWNER');

    const late = await transferContacts(context, {
      caller: supervisorCaller(),
      personIds: [q],
      toAgentId: agentB.agentId,
      reason: 'x',
      now: new Date(Date.now() + 8 * DAY_MS),
    });

    expect(late.failed[0].code).toBe('FOLLOW_UP_ENDED');
    expect((await readPerson(q)).ownerId).toBe(agentA.agentId);
  });

  it('refuses a Do not contact contact: it has no owner to move (spec 9)', async () => {
    const { country, actors } = await setUpScene([PHIL, SCOTT]);
    const [agentA, agentB] = actors;
    const q = await claimedContact(country, agentA);
    const [reason] = await listRecords<{ id: string }>(client, 'reasons', { kind: { eq: 'DO_NOT_CONTACT' } }, {}, 1);
    const now = new Date();

    await logCall(client, agentA, { personId: q, idempotencyKey: `dnc-${randomUUID()}`, technicalStatus: 'NO_ANSWER', next: { mode: 'doNotContact', reasonId: reason.id } }, now);

    expect(await readPerson(q)).toMatchObject({ lifecycleStage: 'DO_NOT_CONTACT', ownerId: null });
    expect((await readAgent(agentA.agentId)).ownedContactCount).toBe(0);

    const moved = await transferContacts(context, { caller: supervisorCaller(), personIds: [q], toAgentId: agentB.agentId, reason: 'x', now });
    const released = await releaseContacts(context, { caller: supervisorCaller(), personIds: [q], reason: 'x', now });

    expect(moved.failed.map(({ code }) => code)).toEqual(['DO_NOT_CONTACT']);
    expect(released.failed.map(({ code }) => code)).toEqual(['DO_NOT_CONTACT']);
    expect((await readPerson(q)).lifecycleStage).toBe('DO_NOT_CONTACT');
  });

  it('releases to Free with no cool-down and voids the deal as Released', async () => {
    const { country, actors } = await setUpScene([PHIL]);
    const [agentA] = actors;
    const q = await claimedContact(country, agentA);
    const dealId = (await openDealOf(q)).id;
    const result = await releaseContacts(context, { caller: fullAdminCaller(), personIds: [q], reason: 'Agent left', now: new Date() });

    expect(result.succeeded).toEqual([q]);
    expect(await readPerson(q)).toMatchObject({ lifecycleStage: 'FREE', ownerId: null, cooldownUntil: null });
    expect((await readPerson(q)).planProgress).toBeFalsy();
    expect((await readPerson(q)).eligibleMemberIds).toEqual([agentA.memberId]);
    expect((await dealsOf(q)).find(({ id }) => id === dealId)).toMatchObject({ dealStage: 'VOID', closeReason: 'RELEASED', openDealKey: '' });
    expect((await readAgent(agentA.agentId)).ownedContactCount).toBe(0);
    expect((await auditsOf({ contactId: { eq: q } }))[0]).toMatchObject({ action: 'RELEASE', status: 'DONE', reason: 'Agent left' });
  });

  it('lets a Supervisor transfer to their own agent (AS2)', async () => {
    const { country, actors } = await setUpScene([PHIL, JONY]);
    const [agentA, supervisorAgent] = actors;
    const q = await claimedContact(country, agentA);
    const result = await transferContacts(context, {
      caller: supervisorCaller(supervisorAgent.agentId),
      personIds: [q],
      toAgentId: supervisorAgent.agentId,
      reason: 'I take it',
      now: new Date(),
    });

    expect(result.succeeded).toEqual([q]);
    expect((await readPerson(q)).ownerId).toBe(supervisorAgent.agentId);
  });

  it('finishes a transfer that died halfway through the sweeper, and keeps the claim reconciler away', async () => {
    const { country, actors } = await setUpScene([PHIL, SCOTT]);
    const [agentA, agentB] = actors;
    const q = await claimedContact(country, agentA);
    let failures = 2;
    const flaky = new Proxy(client, {
      get: (target, property, receiver) =>
        property === 'mutation'
          ? (query: Record<string, unknown>) => {
              if ('createOpportunity' in query && failures > 0) {
                failures -= 1;

                throw new Error('injected failure');
              }

              return target.mutation(query as never);
            }
          : Reflect.get(target, property, receiver),
    });
    const result = await transferContacts(
      { client: flaky, metadata },
      { caller: supervisorCaller(), personIds: [q], toAgentId: agentB.agentId, reason: 'move', now: new Date() },
    );

    expect(result.failed[0].message).toContain('injected failure');

    const [stuck] = await auditsOf({ contactId: { eq: q } });

    expect(stuck).toMatchObject({ status: 'IN_PROGRESS', attempts: 1 });
    expect(stuck.lastError).toContain('injected failure');
    expect(await dealsOf(q)).toHaveLength(1);

    const later = new Date(Date.now() + 3 * 60 * 1000);

    expect(await reconcileClaims(client, later)).toBe(0);
    expect((await readPerson(q)).ownerId).toBe(agentB.agentId);

    await runSweeper(later, client);

    const [done] = await auditsOf({ contactId: { eq: q } });
    const open = (await dealsOf(q)).filter(({ openDealKey }) => openDealKey);

    expect(done.status).toBe('DONE');
    expect(done.lastError).toBeFalsy();
    expect(open).toHaveLength(1);
    expect(open[0].agentId).toBe(agentB.agentId);
  });

  it('ends an operation that keeps failing as Failed for review after five attempts', async () => {
    const { country, actors } = await setUpScene([PHIL, SCOTT]);
    const q = await claimedContact(country, actors[0]);
    const auditId = await track(
      'AuditLog',
      createRecord(client, 'AuditLog', {
        name: 'stuck',
        action: 'TRANSFER',
        status: 'IN_PROGRESS',
        occurredAt: new Date(Date.now() - HOUR_MS).toISOString(),
        effectiveAt: new Date(Date.now() - HOUR_MS).toISOString(),
        attempts: 5,
        contactId: q,
        fromAgentId: actors[0].agentId,
        toAgentId: actors[1].agentId,
        details: {},
      }),
    );

    await resumeAudits(context, new Date());

    expect((await auditsOf({ id: { eq: auditId } }))[0]).toMatchObject({ status: 'FAILED', needsReview: true });
  });
});

describe('freeze and unfreeze (S12, S13, S14, AS2)', () => {
  it('pauses a follow-up and resumes it with exactly the days it had left, twice-safe (S12)', async () => {
    const { country, actors } = await setUpScene([PHIL]);
    const [agentA] = actors;
    const p = await claimedContact(country, agentA);
    const opened = new Date((await openDealOf(p)).openedAt);

    await answer(agentA, p, opened);

    const before = await openDealOf(p);
    const t0 = new Date(before.firstAnsweredCallAt!);
    const frozenAt = new Date(t0.getTime() + 5 * DAY_MS);
    const unfrozenAt = new Date(frozenAt.getTime() + 10 * DAY_MS);

    await freezeAgent(context, { caller: supervisorCaller(), agentId: agentA.agentId, now: frozenAt });

    expect((await readAgent(agentA.agentId)).frozenSince).toBe(frozenAt.toISOString());
    expect((await readPerson(p)).planProgress).toBe(FROZEN_PLAN_PROGRESS);
    expect((await refusalOf(loadAgentActor(client, agentA.memberId))).code).toBe('AGENT_FROZEN');
    expect(await closeExpiredDeals(client, await loadEligibilityPlan(client, metadata), new Date(t0.getTime() + 100 * DAY_MS))).toBe(0);
    expect((await openDealOf(p)).deadlineAt).toBe(before.deadlineAt);

    await unfreezeAgent(context, { caller: supervisorCaller(), agentId: agentA.agentId, now: unfrozenAt });

    const after = await openDealOf(p);

    expect(new Date(after.deadlineAt).getTime() - unfrozenAt.getTime()).toBe(25 * DAY_MS);
    expect(after.frozenMs).toBe(10 * DAY_MS);
    expect((await readPerson(p)).deadlineAt).toBe(after.deadlineAt);
    expect((await readPerson(p)).planProgress).toContain('از ۳۰');
    expect((await readAgent(agentA.agentId)).frozenSince).toBeNull();

    const [unfreezeAudit] = await auditsOf({ and: [{ subjectAgentId: { eq: agentA.agentId } }, { action: { eq: 'UNFREEZE' } }] });
    const rerun = await runAudit(context, await loadAudit(client, unfreezeAudit.id), FREEZE_EXECUTORS.UNFREEZE);

    expect(rerun.ok).toBe(true);
    expect((await openDealOf(p)).deadlineAt).toBe(after.deadlineAt);
    expect((await openDealOf(p)).frozenMs).toBe(10 * DAY_MS);

    // A crash between the person and the deal write leaves the person shifted and the deal not.
    const settled = await readPerson(p);

    await updateRecord(client, 'Opportunity', after.id, { deadlineAt: before.deadlineAt, frozenMs: before.frozenMs ?? 0, lastFreezeShiftId: null });
    await runAudit(context, await loadAudit(client, unfreezeAudit.id), FREEZE_EXECUTORS.UNFREEZE);

    expect((await openDealOf(p)).deadlineAt).toBe(after.deadlineAt);
    expect((await readPerson(p)).nextCallAt).toBe(settled.nextCallAt);

    const [period] = await listRecords<{ endedAt: string | null; daysFrozen: number }>(
      client,
      'freezePeriods',
      { agentId: { eq: agentA.agentId } },
      { endedAt: true, daysFrozen: true },
    );

    expect(period).toMatchObject({ endedAt: unfrozenAt.toISOString(), daysFrozen: 10 });
  });

  it('starts a rebuy window for a frozen owner at unfreeze (S13)', async () => {
    const { actors } = await setUpScene([PHIL]);
    const [agentA] = actors;
    const monday = new Date('2026-03-02T09:00:00Z');
    const wednesday = new Date(monday.getTime() + 2 * DAY_MS);
    const saturday = new Date(monday.getTime() + 5 * DAY_MS);
    const m = await track(
      'Person',
      createRecord(client, 'Person', {
        name: { firstName: 'Cus', lastName: randomUUID().slice(0, 8) },
        platformUserId: `u_${randomUUID()}`,
        lifecycleStage: 'CUSTOMER',
        ownerId: agentA.agentId,
        ownerMemberId: agentA.memberId,
      }),
    );

    await freezeAgent(context, { caller: supervisorCaller(), agentId: agentA.agentId, now: monday });
    await processAccountLastLost(
      client,
      {
        eventId: randomUUID(),
        type: 'account.last_lost',
        schemaVersion: '1.0',
        occurredAt: wednesday.toISOString(),
        data: { platformUserId: (await listRecords<{ platformUserId: string }>(client, 'people', { id: { eq: m } }, { platformUserId: true }, 1))[0].platformUserId },
      } satisfies PlatformEvent,
      wednesday,
    );

    const rebuy = await openDealOf(m);

    expect(rebuy.dealStage).toBe('REBUY_WINDOW');
    expect((await readPerson(m)).planProgress).toBe(FROZEN_PLAN_PROGRESS);
    created.push({ singular: 'Opportunity', id: rebuy.id });

    await unfreezeAgent(context, { caller: supervisorCaller(), agentId: agentA.agentId, now: saturday });

    expect(new Date((await openDealOf(m)).deadlineAt).getTime()).toBe(saturday.getTime() + 72 * HOUR_MS);
    expect((await readPerson(m)).planProgress).toBe('۷۲ ساعت مانده');
  });

  it('keeps a long freeze frozen, tags it from day 7 and still allows transfers from it (S14)', async () => {
    const { country, actors } = await setUpScene([PHIL, SCOTT]);
    const [agentA, agentB] = actors;
    const p = await claimedContact(country, agentA);
    const opened = new Date((await openDealOf(p)).openedAt);

    await answer(agentA, p, opened);

    const before = await openDealOf(p);
    const frozenAt = new Date(opened.getTime() + DAY_MS);

    await freezeAgent(context, { caller: supervisorCaller(), agentId: agentA.agentId, now: frozenAt });

    const day6 = new Date(frozenAt.getTime() + 6 * DAY_MS + HOUR_MS);
    const day60 = new Date(frozenAt.getTime() + 60 * DAY_MS);

    await refreshFreezePeriods(client, day6);
    expect((await listRecords<{ longFreeze: boolean }>(client, 'freezePeriods', { agentId: { eq: agentA.agentId } }, { longFreeze: true }))[0].longFreeze).toBe(false);

    await refreshFreezePeriods(client, day60);

    const [period] = await listRecords<{ daysFrozen: number; longFreeze: boolean; waitingContacts: number; endedAt: string | null }>(
      client,
      'freezePeriods',
      { agentId: { eq: agentA.agentId } },
      { daysFrozen: true, longFreeze: true, waitingContacts: true, endedAt: true },
    );

    expect(period).toMatchObject({ daysFrozen: 60, longFreeze: true, waitingContacts: 1, endedAt: null });
    expect((await readAgent(agentA.agentId)).frozenSince).not.toBeNull();

    const moved = await transferContacts(context, { caller: supervisorCaller(), personIds: [p], toAgentId: agentB.agentId, reason: 'long freeze', now: day60 });

    expect(moved.succeeded).toEqual([p]);

    const next = await openDealOf(p);

    // The new deal gets the frozen time added, so B has what A had left when frozen.
    expect(new Date(next.deadlineAt).getTime() - day60.getTime()).toBe(new Date(before.deadlineAt).getTime() - frozenAt.getTime());
  });

  it('refuses self-freeze, a frozen or inactive target, and a Supervisor freezing a Supervisor (AS2)', async () => {
    const { country, actors } = await setUpScene([PHIL, JONY]);
    const [agentA, supervisorAgent] = actors;

    expect((await refusalOf(freezeAgent(context, { caller: supervisorCaller(supervisorAgent.agentId), agentId: supervisorAgent.agentId, now: new Date() }))).code).toBe('SELF_FREEZE');

    const otherSupervisor = { ...supervisorCaller(), agentId: agentA.agentId };

    expect((await refusalOf(freezeAgent(context, { caller: otherSupervisor, agentId: supervisorAgent.agentId, now: new Date() }))).code).toBe('FULL_ADMIN_ONLY');

    await freezeAgent(context, { caller: fullAdminCaller(), agentId: supervisorAgent.agentId, now: new Date() });
    expect((await refusalOf(freezeAgent(context, { caller: fullAdminCaller(), agentId: supervisorAgent.agentId, now: new Date() }))).code).toBe('ALREADY_FROZEN');

    const q = await claimedContact(country, agentA);

    expect((await refusalOf(transferContacts(context, { caller: fullAdminCaller(), personIds: [q], toAgentId: supervisorAgent.agentId, reason: 'x', now: new Date() }))).code).toBe('TARGET_FROZEN');
  });
});

describe('deactivate and reactivate (S8)', () => {
  it('refuses while the agent owns contacts, allows after transfer and release, and ends a freeze', async () => {
    const { country, actors } = await setUpScene([PHIL, SCOTT]);
    const [agentA, agentB] = actors;
    const first = await claimedContact(country, agentA);
    const second = await claimedContact(country, agentA);
    const refusal = await refusalOf(deactivateAgent(context, { caller: fullAdminCaller(), agentId: agentA.agentId, now: new Date() }));

    expect(refusal.message).toBe('Owns 2 contacts. Transfer or release them first.');
    expect((await readAgent(agentA.agentId)).isActive).toBe(true);

    await freezeAgent(context, { caller: supervisorCaller(), agentId: agentA.agentId, now: new Date() });
    await transferContacts(context, { caller: supervisorCaller(), personIds: [first], toAgentId: agentB.agentId, reason: 'leaving', now: new Date() });
    await releaseContacts(context, { caller: supervisorCaller(), personIds: [second], reason: 'leaving', now: new Date() });
    await deactivateAgent(context, { caller: fullAdminCaller(), agentId: agentA.agentId, now: new Date() });

    expect(await readAgent(agentA.agentId)).toMatchObject({ isActive: false, frozenSince: null, ownedContactCount: 0 });
    expect((await refusalOf(loadAgentActor(client, agentA.memberId))).code).toBe('NO_ACTIVE_AGENT');
    expect(await auditsOf({ and: [{ subjectAgentId: { eq: agentA.agentId } }, { action: { eq: 'AGENT_DEACTIVATED' } }] })).toHaveLength(1);

    await reactivateAgent(context, { caller: fullAdminCaller(), agentId: agentA.agentId, now: new Date() });
    expect((await readAgent(agentA.agentId)).isActive).toBe(true);
  });

  it('flags an agent whose status and role disagree once', async () => {
    const { actors } = await setUpScene([PHIL]);
    const [agentA] = actors;

    await updateRecord(client, 'Agent', agentA.agentId, { isActive: false });

    expect(await flagRoleMismatches(context, new Date())).toBeGreaterThanOrEqual(1);
    expect(await flagRoleMismatches(context, new Date())).toBe(0);

    const flagged = await auditsOf({ and: [{ subjectAgentId: { eq: agentA.agentId } }, { needsReview: { eq: true } }] });

    expect(flagged).toHaveLength(1);
  });
});

describe('edit note (TS5)', () => {
  it('lets only the author change the note and keeps the previous text in the Audit log', async () => {
    const { country, actors } = await setUpScene([PHIL, SCOTT]);
    const [agentA, agentB] = actors;
    const p = await claimedContact(country, agentA);
    const { callId } = await answer(agentA, p, new Date(), 'old text');

    expect((await refusalOf(editCallNote(client, agentB, { callId, note: 'hijack' }, new Date()))).code).toBe('NOT_AUTHOR');

    await editCallNote(client, agentA, { callId, note: 'new text' }, new Date());

    const [call] = await listRecords<{ note: string; noteEditedAt: string | null; technicalStatus: string; answered: boolean }>(
      client,
      'calls',
      { id: { eq: callId } },
      { note: true, noteEditedAt: true, technicalStatus: true, answered: true },
    );

    expect(call).toMatchObject({ note: 'new text', technicalStatus: 'ANSWERED', answered: true });
    expect(call.noteEditedAt).not.toBeNull();

    const [audit] = await auditsOf({ and: [{ action: { eq: 'NOTE_EDITED' } }, { contactId: { eq: p } }] });

    expect(audit.details).toMatchObject({ previousNote: 'old text' });
  });
});
