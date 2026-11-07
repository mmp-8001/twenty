import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { NOT_ALLOWED_MESSAGE } from '../constants/admin-management.constant';
import {
  CREATE_MONTHLY_INCOMES_ROUTE_PATH,
  INCOME_NOT_AVAILABLE_MESSAGE,
  MARK_INCOME_PAID_ROUTE_PATH,
  MY_REPORT_ROUTE_PATH,
  TEAM_REPORT_ROUTE_PATH,
} from '../constants/income-report.constant';
import { ADD_TO_FOLLOWUP_ROUTE_PATH } from '../constants/ownership.constant';
import { PROOPCO_SYNC_TOKEN_HEADER } from '../constants/proopco-sync.constant';
import { jalaliMonthBounds, jalaliPartsOf } from '../utils/jalali.util';
import { postRoute, postSyncRoute } from './post-sync-route';
import { mutate, query, tokenHeaders, uniqueId } from './sales-core-helpers';
import {
  assignSeededRoles,
  SEEDED_AGENT_EMAIL,
  SEEDED_MANAGER_EMAIL,
  SEEDED_OTHER_AGENT_EMAIL,
  signIn,
  userRequest,
} from './seeded-sessions';
import { TEST_SYNC_TOKEN } from './test-constants';

type Row = Record<string, any>;

// Purchases are real sync payments dated now, so the rollup runs for the current Jalali month as if
// it had just ended. global-setup reinstalls the app, so no other Commissions exist in it.
const { year: YEAR, month: MONTH } = jalaliPartsOf(new Date());
const REFERENCE_DATE = new Date(jalaliMonthBounds(YEAR, MONTH).end.getTime() + 3_600_000);
const SECOND_SALES_ADMIN_EMAIL = 'scott.forstall@apple.dev';

describe('Monthly income and reports', () => {
  const tag = uniqueId('inc');
  const created: { singular: string; id: string }[] = [];
  const tokens: Record<string, string> = {};
  const ids: Record<string, string> = {};
  let restoreRoles: () => Promise<void>;

  const readAll = async (collection: string, filter: Record<string, unknown>, selection: object): Promise<Row[]> => {
    const result = await query({
      [collection]: { __args: { filter, first: 50 }, edges: { node: { id: true, ...selection } } },
    });

    return (result[collection].edges as { node: Row }[]).map(({ node }) => node);
  };

  const sync = async (items: unknown[]) => {
    const { data } = await postSyncRoute({ headers: tokenHeaders, body: { items } });

    expect(data.success).toBe(true);
    expect(data.results.every(({ status }: { status: string }) => status !== 'error')).toBe(true);
  };

  // An owned user mid follow-up, added through the real route, who then buys the given amounts.
  const purchases = async (who: string, suffix: string, amountsUsdt: number[]) => {
    const proopcoId = `${tag}-${suffix}`;
    const personResult = await mutate({
      createPerson: {
        __args: { data: { name: { firstName: 'Inc', lastName: proopcoId }, proopcoId, visibleToMemberIds: [ids[who]] } },
        id: true,
      },
    });
    const personId = personResult.createPerson.id as string;

    created.push({ singular: 'Person', id: personId });
    expect(
      (await postRoute({ path: ADD_TO_FOLLOWUP_ROUTE_PATH, headers: { authorization: `Bearer ${tokens[who]}` }, body: { personId } }))
        .data,
    ).toMatchObject({ success: true });

    const [followup] = await readAll('followups', { openKey: { eq: personId } }, {});
    const [ownership] = await readAll('ownerships', { openUserKey: { eq: personId } }, {});

    await mutate({
      updateFollowup: { __args: { id: followup.id, data: { status: 'IN_PROGRESS', deadlineAt: new Date(Date.now() + 30 * 86_400_000).toISOString() } }, id: true },
    });
    await mutate({ updateOwnership: { __args: { id: ownership.id, data: { state: 'IN_FOLLOWUP' } }, id: true } });

    await sync(
      amountsUsdt.flatMap((amountUsdt, index) => [
        { type: 'account', proopcoId: `${proopcoId}-a${index}`, data: { userProopcoId: proopcoId, status: 'active' } },
        {
          type: 'payment',
          proopcoId: `${proopcoId}-p${index}`,
          data: {
            userProopcoId: proopcoId,
            accountProopcoId: `${proopcoId}-a${index}`,
            amountToman: amountUsdt * 60000,
            amountUsdt,
            paidAt: new Date().toISOString(),
          },
        },
      ]),
    );
  };

  const rollup = async () =>
    (
      await postRoute({
        path: CREATE_MONTHLY_INCOMES_ROUTE_PATH,
        headers: { [PROOPCO_SYNC_TOKEN_HEADER]: TEST_SYNC_TOKEN },
        body: { referenceDate: REFERENCE_DATE.toISOString() },
      })
    ).data;

  const route = async (who: string, path: string, body: unknown = {}) =>
    (await postRoute({ path, headers: { authorization: `Bearer ${tokens[who]}` }, body })).data as Row;

  const incomesOf = (who: string) =>
    readAll('monthlyIncomes', { adminId: { eq: ids[who] }, jalaliYear: { eq: YEAR }, jalaliMonth: { eq: MONTH } }, {
      status: true,
      totalUsdt: true,
      paidById: true,
      paidAt: true,
    });

  beforeAll(async () => {
    const assigned = await assignSeededRoles([
      { email: SEEDED_AGENT_EMAIL, roleLabel: 'Sales Admin' },
      { email: SECOND_SALES_ADMIN_EMAIL, roleLabel: 'Sales Admin' },
      { email: SEEDED_OTHER_AGENT_EMAIL, roleLabel: 'Supervisor' },
      { email: SEEDED_MANAGER_EMAIL, roleLabel: 'Full Admin' },
    ]);
    const emails = {
      agent: SEEDED_AGENT_EMAIL,
      second: SECOND_SALES_ADMIN_EMAIL,
      supervisor: SEEDED_OTHER_AGENT_EMAIL,
      full: SEEDED_MANAGER_EMAIL,
    };

    restoreRoles = assigned.restore;

    for (const [name, email] of Object.entries(emails)) {
      ids[name] = assigned.memberIds[email];
      tokens[name] = await signIn(email);
    }

    await purchases('agent', 'a', [500, 300, 200]);
    await purchases('second', 'b', [350]);
  });

  afterAll(async () => {
    await restoreRoles?.();

    for (const income of [...(await incomesOf('agent')), ...(await incomesOf('second'))]) {
      created.push({ singular: 'MonthlyIncome', id: income.id });
    }

    for (const { singular, id } of created.reverse()) {
      await mutate({ [`destroy${singular}`]: { __args: { id }, id: true } }).catch(() => undefined);
    }
  });

  it('rolls the previous Jalali month into one pending income per admin and never twice (CS2)', async () => {
    expect(await rollup()).toMatchObject({ success: true, year: YEAR, month: MONTH, incomes: 2 });

    expect(await incomesOf('agent')).toMatchObject([{ status: 'PENDING', totalUsdt: 20 }]);
    expect(await incomesOf('second')).toMatchObject([{ status: 'PENDING', totalUsdt: 7 }]);

    const [{ id: incomeId }] = await incomesOf('agent');

    expect(await readAll('commissions', { monthlyIncomeId: { eq: incomeId } }, {})).toHaveLength(3);
    expect(await rollup()).toMatchObject({ success: true, incomes: 0 });
    expect(await incomesOf('agent')).toHaveLength(1);
  });

  it('lets only the Full Admin mark an income paid, once, with an audit entry (CS2)', async () => {
    const [{ id: incomeId }] = await incomesOf('agent');

    expect((await route('agent', MARK_INCOME_PAID_ROUTE_PATH, { incomeId })).error).toBe(NOT_ALLOWED_MESSAGE);
    expect((await route('supervisor', MARK_INCOME_PAID_ROUTE_PATH, { incomeId })).error).toBe(NOT_ALLOWED_MESSAGE);
    expect((await incomesOf('agent'))[0].status).toBe('PENDING');

    expect(await route('full', MARK_INCOME_PAID_ROUTE_PATH, { incomeId })).toEqual({ success: true });
    expect((await route('full', MARK_INCOME_PAID_ROUTE_PATH, { incomeId })).error).toBe(INCOME_NOT_AVAILABLE_MESSAGE);
    expect(await incomesOf('agent')).toMatchObject([{ status: 'PAID', paidById: ids.full }]);
    expect(await readAll('auditLogs', { subjectId: { eq: incomeId }, action: { eq: 'INCOME_PAID' } }, { actorId: true })).toMatchObject([
      { actorId: ids.full },
    ]);

    // A paid income is not reopened by a later rollup, even with a late Commission.
    await purchases('agent', 'late', [100]);
    await rollup();
    expect(await incomesOf('agent')).toMatchObject([{ status: 'PAID', totalUsdt: 20 }]);
  });

  it('shows a Sales Admin only their own commissions and incomes', async () => {
    const read = async (collection: string) => {
      const { data, errors } = await userRequest<Record<string, { edges: { node: Row }[] }>>({
        token: tokens.agent,
        query: `{ ${collection}(first: 100) { edges { node { id adminId } } } }`,
      });

      expect(errors).toBeUndefined();

      return data![collection].edges.map(({ node }) => node.adminId);
    };

    for (const collection of ['commissions', 'monthlyIncomes']) {
      const adminIds = await read(collection);

      expect(adminIds.length).toBeGreaterThan(0);
      expect(adminIds.every((adminId) => adminId === ids.agent)).toBe(true);
    }
  });

  it('gives each role only the report numbers it may see (RS4)', async () => {
    const own = await route('agent', MY_REPORT_ROUTE_PATH, { period: 'ALL', adminId: ids.second });
    const ownCommissions = await readAll('commissions', { adminId: { eq: ids.agent } }, { amountUsdt: true });

    expect(own.success).toBe(true);
    expect(own.report.revenueUsdt).toBe(ownCommissions.reduce((sum, { amountUsdt }) => sum + amountUsdt, 0));
    expect(own.commissions.length).toBe(ownCommissions.length);
    expect(own.incomes).toMatchObject([expect.objectContaining({ jalaliYear: YEAR, jalaliMonth: MONTH, status: 'PAID' })]);
    expect(own).not.toHaveProperty('admins');
    expect((await route('agent', TEAM_REPORT_ROUTE_PATH, { period: 'ALL' })).error).toBe(NOT_ALLOWED_MESSAGE);

    const team = await route('supervisor', TEAM_REPORT_ROUTE_PATH, { period: 'ALL' });
    const names = team.admins.map(({ name }: Row) => name);

    expect(team.success).toBe(true);
    expect(team.admins.map(({ rank }: Row) => rank)).toEqual(names.map((_: string, index: number) => index + 1));
    expect(names).toEqual([...names].sort((left, right) => left.localeCompare(right)));
    expect(team.admins.map(({ memberId }: Row) => memberId)).toEqual(expect.arrayContaining([ids.agent, ids.second, ids.supervisor]));
    expect(team.totals.revenueUsdt).toBeGreaterThan(own.report.revenueUsdt);

    expect((await route('full', TEAM_REPORT_ROUTE_PATH)).success).toBe(true);
  });
});
