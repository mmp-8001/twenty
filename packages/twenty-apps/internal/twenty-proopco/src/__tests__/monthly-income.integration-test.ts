import { describe, expect, it, vi } from 'vitest';

import { MONTHLY_INCOME_ROUTE_PATH } from 'src/constants/proopco-jobs.constant';

import { postRoute } from './post-sync-route';
import {
  commissionsOfPayment,
  createFollowup,
  createPayment,
  createTrader,
  firstMemberId,
  mutate,
  query,
  runCommission,
  tokenHeaders,
} from './sales-core-helpers';

const month = new Date().toISOString().slice(0, 7);

const runMonthlyIncomes = async () =>
  (
    await postRoute({
      path: MONTHLY_INCOME_ROUTE_PATH,
      headers: tokenHeaders,
      body: { month },
    })
  ).data as { success: boolean; created: number; linked: number };

const monthlyIncomesOf = async (agentId: string) => {
  const { monthlyIncomes } = await query({
    monthlyIncomes: {
      __args: { filter: { agentId: { eq: agentId }, month: { eq: month } } },
      edges: {
        node: {
          id: true,
          payoutStatus: true,
          total: { amountMicros: true },
          commissions: { edges: { node: { id: true } } },
        },
      },
    },
  });

  return monthlyIncomes.edges.map(({ node }: { node: Record<string, any> }) => node);
};

const getCommission = async (id: string) => {
  const { commission } = await query({
    commission: {
      __args: { filter: { id: { eq: id } } },
      id: true,
      name: true,
      deletedAt: true,
    },
  });

  return commission;
};

describe('Monthly Income', () => {
  it('lets a Commission outside a Paid Monthly Income be edited', async () => {
    const agentId = await firstMemberId();
    const traderId = await createTrader('income-unlocked');

    await createFollowup({ traderId, ownerId: agentId });
    const paymentId = await createPayment({ traderId, amountUsd: 100 });

    await runCommission(paymentId);

    const [commission] = await commissionsOfPayment(paymentId);

    await mutate({
      updateCommission: {
        __args: { id: commission.id, data: { name: 'edited' } },
        id: true,
      },
    });

    expect((await getCommission(commission.id)).name).toBe('edited');
  });

  it('sums an agent\'s Commissions once, however often it runs, and locks them when Paid', async () => {
    const agentId = await firstMemberId();
    const paymentIds: string[] = [];

    for (const suffix of ['income-a', 'income-b']) {
      const traderId = await createTrader(suffix);

      await createFollowup({ traderId, ownerId: agentId });
      paymentIds.push(await createPayment({ traderId, amountUsd: 100 }));
    }

    for (const paymentId of paymentIds) {
      await runCommission(paymentId);
    }

    const first = await runMonthlyIncomes();

    expect(first).toMatchObject({ success: true, created: 1 });

    const second = await runMonthlyIncomes();

    expect(second).toMatchObject({ success: true, created: 0, linked: 0 });

    const monthlyIncomes = await monthlyIncomesOf(agentId);

    expect(monthlyIncomes).toHaveLength(1);

    const [monthlyIncome] = monthlyIncomes;
    const linkedIds = monthlyIncome.commissions.edges.map(
      ({ node }: { node: { id: string } }) => node.id,
    );

    for (const paymentId of paymentIds) {
      const [commission] = await commissionsOfPayment(paymentId);

      expect(commission.monthlyIncomeId).toBe(monthlyIncome.id);
      expect(linkedIds).toContain(commission.id);
    }

    const { commissions } = await query({
      commissions: {
        __args: { filter: { monthlyIncomeId: { eq: monthlyIncome.id } } },
        edges: { node: { amount: { amountMicros: true } } },
      },
    });
    const expectedTotal = commissions.edges.reduce(
      (sum: number, { node }: { node: { amount: { amountMicros: string } } }) =>
        sum + Number(node.amount.amountMicros),
      0,
    );

    expect(Number(monthlyIncome.total.amountMicros)).toBe(expectedTotal);
    expect(expectedTotal).toBeGreaterThanOrEqual(20_000_000);

    await mutate({
      updateMonthlyIncome: {
        __args: { id: monthlyIncome.id, data: { payoutStatus: 'PAID' } },
        id: true,
      },
    });

    const original = await getCommission(linkedIds[0]);

    await mutate({
      updateCommission: {
        __args: { id: linkedIds[0], data: { name: 'tampered' } },
        id: true,
      },
    });
    await mutate({ deleteCommission: { __args: { id: linkedIds[0] }, id: true } });

    await vi.waitFor(async () => {
      expect(await getCommission(linkedIds[0])).toEqual(original);
    }, { timeout: 30_000, interval: 1_000 });

    expect(await runMonthlyIncomes()).toMatchObject({ created: 0 });
    expect(await monthlyIncomesOf(agentId)).toHaveLength(1);
  });
});
