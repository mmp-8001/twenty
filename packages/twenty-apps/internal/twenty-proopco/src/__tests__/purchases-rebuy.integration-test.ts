import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PROOPCO_SYNC_TOKEN_HEADER } from '../constants/proopco-sync.constant';
import {
  ADD_REBUY_ROUTE_PATH,
  ADD_TO_FOLLOWUP_ROUTE_PATH,
  RECORD_CALL_ROUTE_PATH,
} from '../constants/ownership.constant';
import { postRoute, postSyncRoute } from './post-sync-route';
import { mutate, query, tokenHeaders, uniqueId } from './sales-core-helpers';
import { assignSeededRoles, SEEDED_AGENT_EMAIL, signIn } from './seeded-sessions';
import { TEST_SYNC_TOKEN } from './test-constants';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

type RouteResult = { success: boolean; error?: string };
type Row = Record<string, any>;

describe('Purchases, commission, retention and rebuy', () => {
  const tag = uniqueId('pur');
  const created: { singular: string; id: string }[] = [];
  let agentToken: string;
  let agentId: string;
  let restoreRoles: () => Promise<void>;
  let failureReasonId: string;
  let satisfiedReasonId: string;

  const create = async (singular: string, data: Record<string, unknown>) => {
    const result = await mutate({ [`create${singular}`]: { __args: { data }, id: true } });
    const id = result[`create${singular}`].id as string;

    created.push({ singular, id });

    return id;
  };

  const update = (singular: string, id: string, data: Record<string, unknown>) =>
    mutate({ [`update${singular}`]: { __args: { id, data }, id: true } });

  const readAll = async (collection: string, filter: Record<string, unknown>, selection: object): Promise<Row[]> => {
    const result = await query({
      [collection]: { __args: { filter, first: 50 }, edges: { node: { id: true, ...selection } } },
    });

    return (result[collection].edges as { node: Row }[]).map(({ node }) => node);
  };

  const agentRoute = async (path: string, body: unknown) =>
    (await postRoute({ path, headers: { authorization: `Bearer ${agentToken}` }, body })).data as RouteResult;

  const sync = async (items: unknown[]) => {
    const { data } = await postSyncRoute({ headers: tokenHeaders, body: { items } });

    expect(data.success).toBe(true);
    expect(data.results.every(({ status }: { status: string }) => status !== 'error')).toBe(true);
  };

  const sweep = async (referenceDate: Date) => {
    const { data } = await postRoute({
      path: '/proopco/sweep-followups',
      headers: { [PROOPCO_SYNC_TOKEN_HEADER]: TEST_SYNC_TOKEN },
      body: { referenceDate: referenceDate.toISOString() },
    });

    expect(data.success).toBe(true);
  };

  type TestUser = { personId: string; proopcoId: string; followupId: string; ownershipId: string };

  // An owned user: added through the real route, then moved to the requested state directly.
  const ownedUser = async (
    suffix: string,
    state: 'PENDING_FIRST_CALL' | 'IN_FOLLOWUP' | 'SUCCESSFUL',
  ): Promise<TestUser> => {
    const proopcoId = `${tag}-${suffix}`;
    const personId = await create('Person', {
      name: { firstName: 'Pur', lastName: proopcoId },
      proopcoId,
      visibleToMemberIds: [agentId],
    });

    expect(await agentRoute(ADD_TO_FOLLOWUP_ROUTE_PATH, { personId })).toMatchObject({ success: true });

    const [followup] = await readAll('followups', { openKey: { eq: personId } }, {});
    const [ownership] = await readAll('ownerships', { openUserKey: { eq: personId } }, {});

    if (state === 'IN_FOLLOWUP') {
      await update('Followup', followup.id, {
        status: 'IN_PROGRESS',
        deadlineAt: new Date(Date.now() + 30 * DAY_MS).toISOString(),
      });
      await update('Ownership', ownership.id, { state: 'IN_FOLLOWUP' });
    }

    if (state === 'SUCCESSFUL') {
      await update('Followup', followup.id, { status: 'SUCCESSFUL', openKey: null });
      await update('Ownership', ownership.id, { state: 'SUCCESSFUL' });
    }

    return { personId, proopcoId, followupId: followup.id, ownershipId: ownership.id };
  };

  const account = (user: TestUser, name: string, status: string) => ({
    type: 'account',
    proopcoId: `${user.proopcoId}-${name}`,
    data: { userProopcoId: user.proopcoId, status },
  });

  const payment = (user: TestUser, name: string, amountUsdt: number, accountName = name) => ({
    type: 'payment',
    proopcoId: `${user.proopcoId}-pay-${name}`,
    data: {
      userProopcoId: user.proopcoId,
      accountProopcoId: `${user.proopcoId}-${accountName}`,
      amountToman: amountUsdt * 60000,
      amountUsdt,
      paidAt: new Date().toISOString(),
    },
  });

  const commissionsOf = (user: TestUser) =>
    readAll('commissions', { personId: { eq: user.personId } }, {
      kind: true,
      adminId: true,
      commissionUsdt: true,
      rate: true,
      amountUsdt: true,
      ownershipId: true,
      followupId: true,
    });

  const followupOf = async (id: string) =>
    (await readAll('followups', { id: { eq: id } }, { status: true, kind: true, openKey: true, deadlineAt: true, campaignId: true }))[0];
  const ownershipOf = async (id: string) =>
    (await readAll('ownerships', { id: { eq: id } }, { state: true, endReason: true, openUserKey: true }))[0];
  const personOf = async (id: string) =>
    (await readAll('people', { id: { eq: id } }, { currentOwnerId: true, cooldownUntil: true }))[0];

  // A successful user whose only account is active, then loses it: the rebuy case.
  const rebuyUser = async (suffix: string) => {
    const user = await ownedUser(suffix, 'SUCCESSFUL');

    await sync([account(user, 'a1', 'active')]);
    await sync([account(user, 'a1', 'breached')]);

    const [rebuy] = await readAll('followups', { openKey: { eq: user.personId } }, { kind: true, status: true });

    return { user, rebuyFollowupId: rebuy.id as string };
  };

  beforeAll(async () => {
    const assigned = await assignSeededRoles([{ email: SEEDED_AGENT_EMAIL, roleLabel: 'Sales Admin' }]);

    restoreRoles = assigned.restore;
    agentId = assigned.memberIds[SEEDED_AGENT_EMAIL];
    agentToken = await signIn(SEEDED_AGENT_EMAIL);
    [{ id: failureReasonId }] = await readAll('failureReasons', {}, {});
    [{ id: satisfiedReasonId }] = await readAll('feedbackReasons', { sentiment: { eq: 'POSITIVE' }, isOther: { eq: false } }, {});
  });

  afterAll(async () => {
    await restoreRoles?.();

    for (const { singular, id } of [...created].reverse()) {
      await mutate({ [`destroy${singular}`]: { __args: { id }, id: true } }).catch(() => undefined);
    }
  });

  it('ends ownership without commission when the user buys before the first call (RS1)', async () => {
    const user = await ownedUser('rs1', 'PENDING_FIRST_CALL');

    await sync([account(user, 'a1', 'active'), payment(user, 'p1', 500, 'a1')]);

    expect(await followupOf(user.followupId)).toMatchObject({ status: 'PURCHASE_BEFORE_CALL', openKey: '' });
    expect(await ownershipOf(user.ownershipId)).toMatchObject({ endReason: 'PURCHASE_BEFORE_CALL', openUserKey: '' });
    expect((await personOf(user.personId)).currentOwnerId).toBeNull();
    expect((await personOf(user.personId)).cooldownUntil).toBeNull();
    expect(await commissionsOf(user)).toHaveLength(0);
    expect(await readAll('followups', { personId: { eq: user.personId }, kind: { eq: 'REBUY' } }, {})).toHaveLength(0);
  });

  it('pays the case commission, then retention commissions, 2% each (CS1)', async () => {
    const user = await ownedUser('cs1', 'IN_FOLLOWUP');

    await sync([
      account(user, 'a1', 'active'),
      account(user, 'a2', 'active'),
      account(user, 'a3', 'active'),
      payment(user, 'p1', 500, 'a1'),
    ]);

    expect(await followupOf(user.followupId)).toMatchObject({ status: 'SUCCESSFUL', openKey: '' });
    expect(await ownershipOf(user.ownershipId)).toMatchObject({ state: 'SUCCESSFUL', openUserKey: user.personId });
    expect((await personOf(user.personId)).currentOwnerId).toBe(agentId);

    await sync([payment(user, 'p2', 300, 'a2'), payment(user, 'p3', 200, 'a3')]);

    const commissions = await commissionsOf(user);

    expect(commissions.map(({ kind }) => kind).sort()).toEqual(['CAMPAIGN_SUCCESS', 'RETENTION', 'RETENTION']);
    expect(commissions.every(({ adminId, rate }) => adminId === agentId && rate === 2)).toBe(true);
    expect(commissions.reduce((total, { commissionUsdt }) => total + commissionUsdt, 0)).toBe(20);
    expect(commissions.find(({ kind }) => kind === 'RETENTION')!.followupId).toBe('');
  });

  it('never pays one account twice, even when payments repeat or resend (COM-03)', async () => {
    const user = await ownedUser('com03', 'IN_FOLLOWUP');

    await sync([account(user, 'a1', 'active'), payment(user, 'p1', 100, 'a1')]);
    await sync([payment(user, 'p1', 100, 'a1'), payment(user, 'p2', 100, 'a1')]);

    expect(await commissionsOf(user)).toHaveLength(1);
  });

  it('keeps the user when one of several accounts is lost (S6) and sends the last loss to rebuy (S5)', async () => {
    const user = await ownedUser('s56', 'SUCCESSFUL');

    await sync([account(user, 'a1', 'active'), account(user, 'a2', 'active')]);
    await sync([account(user, 'a1', 'breached')]);

    expect(await ownershipOf(user.ownershipId)).toMatchObject({ state: 'SUCCESSFUL' });
    expect(await readAll('followups', { personId: { eq: user.personId }, kind: { eq: 'REBUY' } }, {})).toHaveLength(0);

    const before = Date.now();

    await sync([account(user, 'a2', 'breached')]);
    // A resend creates nothing more.
    await sync([account(user, 'a2', 'breached')]);

    const rebuy = await readAll('followups', { personId: { eq: user.personId }, kind: { eq: 'REBUY' } }, {
      status: true,
      deadlineAt: true,
      campaignId: true,
      adminId: true,
    });

    expect(rebuy).toHaveLength(1);
    expect(rebuy[0]).toMatchObject({ status: 'REBUY_PENDING', adminId: agentId });
    expect(rebuy[0].campaignId).toBeNull();
    expect(Math.abs(new Date(rebuy[0].deadlineAt).getTime() - (before + 72 * HOUR_MS))).toBeLessThan(2 * 60_000);
    expect(await ownershipOf(user.ownershipId)).toMatchObject({ state: 'REBUY_PENDING' });
  });

  it('closes a waiting rebuy case as successful when the user buys first (U2)', async () => {
    const { user, rebuyFollowupId } = await rebuyUser('u2');

    await sync([account(user, 'a2', 'active'), payment(user, 'p1', 250, 'a2')]);

    expect(await followupOf(rebuyFollowupId)).toMatchObject({ status: 'SUCCESSFUL', openKey: '' });
    expect(await ownershipOf(user.ownershipId)).toMatchObject({ state: 'SUCCESSFUL' });

    const commissions = await commissionsOf(user);

    expect(commissions).toHaveLength(1);
    expect(commissions[0]).toMatchObject({ kind: 'REBUY_SUCCESS', adminId: agentId, commissionUsdt: 5 });
  });

  it('moves a successful user to failed without a case record and keeps the commission (U3)', async () => {
    const user = await ownedUser('u3', 'SUCCESSFUL');

    await sync([account(user, 'a1', 'active'), payment(user, 'p1', 100, 'a1')]);

    const result = await agentRoute(RECORD_CALL_ROUTE_PATH, {
      personId: user.personId,
      technicalStatus: 'ANSWERED',
      feedbackReasonIds: [satisfiedReasonId],
      failureReasonId,
      note: 'not interested',
    });

    expect(result.success).toBe(true);
    expect(await ownershipOf(user.ownershipId)).toMatchObject({ endReason: 'FAILED', openUserKey: '' });
    expect(await readAll('followups', { openKey: { eq: user.personId } }, {})).toHaveLength(0);
    expect(await commissionsOf(user)).toHaveLength(1);
  });

  it('adds a rebuy case to follow-up with 30 days and windows from the click, then expires into the global cooldown (RB-03, RB-04)', async () => {
    const { user, rebuyFollowupId } = await rebuyUser('rb3');
    const before = Date.now();

    expect(await agentRoute(ADD_REBUY_ROUTE_PATH, { followupId: rebuyFollowupId })).toMatchObject({ success: true });
    expect(await agentRoute(ADD_REBUY_ROUTE_PATH, { followupId: rebuyFollowupId })).toMatchObject({ success: false });

    const followup = await followupOf(rebuyFollowupId);
    const touches = await readAll('touches', { followupId: { eq: rebuyFollowupId } }, { touchNo: true, windowStartAt: true });

    expect(followup).toMatchObject({ status: 'IN_PROGRESS', kind: 'REBUY' });
    expect(Math.abs(new Date(followup.deadlineAt).getTime() - (before + 30 * DAY_MS))).toBeLessThan(2 * 60_000);
    expect(await ownershipOf(user.ownershipId)).toMatchObject({ state: 'IN_FOLLOWUP' });
    expect(touches).toHaveLength(5);

    const reference = new Date(before + 31 * DAY_MS);

    await sweep(reference);

    expect(await followupOf(rebuyFollowupId)).toMatchObject({ status: 'EXPIRED' });
    expect(new Date((await personOf(user.personId)).cooldownUntil).getTime()).toBe(reference.getTime() + 30 * DAY_MS);
  });

  it('releases a rebuy case untouched for 72h without a cooldown (RB-04)', async () => {
    const { user, rebuyFollowupId } = await rebuyUser('rb4');

    await sweep(new Date(Date.now() + 73 * HOUR_MS));

    expect(await followupOf(rebuyFollowupId)).toMatchObject({ status: 'RELEASED_72H', openKey: '' });
    expect(await ownershipOf(user.ownershipId)).toMatchObject({ endReason: 'RELEASED_72H', openUserKey: '' });
    expect(await personOf(user.personId)).toMatchObject({ currentOwnerId: null, cooldownUntil: null });
  });
});
