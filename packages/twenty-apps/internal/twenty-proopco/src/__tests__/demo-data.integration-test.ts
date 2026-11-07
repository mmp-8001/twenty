import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  REMOVE_DEMO_DATA_ROUTE_PATH,
  SEED_DEMO_DATA_ROUTE_PATH,
} from '../constants/demo-data.constant';
import { ADD_TO_FOLLOWUP_ROUTE_PATH, FOLLOWUP_STATUSES, OWNERSHIP_STATES } from '../constants/ownership.constant';
import { postRoute } from './post-sync-route';
import { mutate, query, uniqueId } from './sales-core-helpers';
import {
  assignSeededRoles,
  SEEDED_AGENT_EMAIL,
  SEEDED_MANAGER_EMAIL,
  SEEDED_OTHER_AGENT_EMAIL,
  signIn,
} from './seeded-sessions';

type Row = Record<string, any>;

const DEMO = { like: 'demo-%' };

describe('Demo data', () => {
  const tokens: Record<string, string> = {};
  let restoreRoles: () => Promise<void>;
  let agentId: string;
  let realPersonId: string;

  const readAll = async (collection: string, filter: Record<string, unknown>, selection: object = {}): Promise<Row[]> => {
    const result = await query({
      [collection]: { __args: { filter, first: 200 }, edges: { node: { id: true, ...selection } } },
    });

    return (result[collection].edges as { node: Row }[]).map(({ node }) => node);
  };

  const route = async (who: string, path: string) =>
    (await postRoute({ path, headers: { authorization: `Bearer ${tokens[who]}` }, body: {} })).data as Row;

  const demoCounts = async () => ({
    people: (await readAll('people', { proopcoId: DEMO })).length,
    accounts: (await readAll('challengeAccounts', { proopcoId: DEMO })).length,
    payments: (await readAll('payments', { proopcoId: DEMO })).length,
    commissions: (await readAll('commissions', { accountKey: DEMO })).length,
    incomes: (await readAll('monthlyIncomes', { incomeKey: DEMO })).length,
    offers: (await readAll('offers', { title: DEMO })).length,
    freezes: (await readAll('adminFreezes', { reason: DEMO })).length,
  });

  const realState = async () => ({
    person: await readAll('people', { id: { eq: realPersonId } }, { proopcoId: true, currentOwnerId: true }),
    ownerships: await readAll('ownerships', { personId: { eq: realPersonId } }, { state: true }),
    followups: await readAll('followups', { personId: { eq: realPersonId } }, { status: true, deadlineAt: true }),
    members: await readAll('workspaceMembers', {}, { crmStatus: true, frozenSince: true }),
  });

  beforeAll(async () => {
    const assigned = await assignSeededRoles([
      { email: SEEDED_AGENT_EMAIL, roleLabel: 'Sales Agent' },
      { email: SEEDED_OTHER_AGENT_EMAIL, roleLabel: 'Supervisor' },
      { email: SEEDED_MANAGER_EMAIL, roleLabel: 'Full Admin' },
    ]);

    restoreRoles = assigned.restore;
    agentId = assigned.memberIds[SEEDED_AGENT_EMAIL];
    tokens.agent = await signIn(SEEDED_AGENT_EMAIL);
    tokens.full = await signIn(SEEDED_MANAGER_EMAIL);

    // A real (non-demo) user with its own case, which demo removal must leave alone.
    const proopcoId = uniqueId('real');
    const created = await mutate({
      createPerson: {
        __args: { data: { name: { firstName: 'Real', lastName: proopcoId }, proopcoId, visibleToMemberIds: [agentId] } },
        id: true,
      },
    });

    realPersonId = created.createPerson.id;
    expect(
      (await postRoute({ path: ADD_TO_FOLLOWUP_ROUTE_PATH, headers: { authorization: `Bearer ${tokens.agent}` }, body: { personId: realPersonId } }))
        .data,
    ).toMatchObject({ success: true });
  });

  afterAll(async () => {
    await route('full', REMOVE_DEMO_DATA_ROUTE_PATH);
    await restoreRoles?.();
  });

  it('refuses everyone but the Full Admin', async () => {
    expect((await route('agent', SEED_DEMO_DATA_ROUTE_PATH)).success).toBe(false);
    expect((await route('agent', REMOVE_DEMO_DATA_ROUTE_PATH)).success).toBe(false);
    expect((await demoCounts()).people).toBe(0);
  });

  it('seeds every case status, ownership state, a rebuy user and paid and pending incomes', async () => {
    const realBefore = await realState();

    expect(await route('full', SEED_DEMO_DATA_ROUTE_PATH)).toMatchObject({ success: true, seeded: true });

    const demoPeople = await readAll('people', { proopcoId: DEMO });
    const demoFollowups = await readAll('followups', { personId: { in: demoPeople.map(({ id }) => id) } }, {
      status: true,
      kind: true,
      deadlineAt: true,
      frozenRemainingSeconds: true,
    });
    const ownerships = await readAll('ownerships', { personId: { in: demoPeople.map(({ id }) => id) } }, { state: true });

    expect(new Set(demoFollowups.map(({ status }) => status))).toEqual(new Set(FOLLOWUP_STATUSES));
    expect(new Set(ownerships.map(({ state }) => state))).toEqual(new Set(OWNERSHIP_STATES));
    expect(demoFollowups.some(({ status, kind, deadlineAt }) => status === 'REBUY_PENDING' && kind === 'REBUY' && deadlineAt)).toBe(true);

    // No real member is touched: nobody is frozen and the Full Admin owns no demo case.
    expect(await readAll('workspaceMembers', { crmStatus: { eq: 'FROZEN' } })).toHaveLength(0);

    const incomes = await readAll('monthlyIncomes', { incomeKey: DEMO }, { status: true, totalUsdt: true });

    expect(incomes.map(({ status }) => status).sort()).toEqual(['PAID', 'PENDING']);
    expect(incomes.every(({ totalUsdt }) => totalUsdt > 0)).toBe(true);
    expect((await readAll('commissions', { accountKey: DEMO })).length).toBe(2);
    expect((await readAll('offerActivations', { personId: { in: demoPeople.map(({ id }) => id) } })).length).toBe(2);
    expect(await realState()).toEqual(realBefore);
  });

  it('seeding twice changes nothing', async () => {
    const before = await demoCounts();

    expect(await route('full', SEED_DEMO_DATA_ROUTE_PATH)).toMatchObject({ success: true, seeded: false });
    expect(await demoCounts()).toEqual(before);
  });

  it('removes only demo records and a second removal is a no-op', async () => {
    const realBefore = await realState();

    expect(await route('full', REMOVE_DEMO_DATA_ROUTE_PATH)).toMatchObject({ success: true });
    expect(await demoCounts()).toMatchObject({
      people: 0,
      accounts: 0,
      payments: 0,
      commissions: 0,
      incomes: 0,
      offers: 0,
      freezes: 0,
    });
    expect(await realState()).toEqual(realBefore);
    expect(await route('full', REMOVE_DEMO_DATA_ROUTE_PATH)).toEqual({ success: true, removed: 0 });
  });
});
