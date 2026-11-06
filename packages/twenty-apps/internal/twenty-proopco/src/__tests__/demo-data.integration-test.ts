import { describe, expect, it } from 'vitest';

import {
  REMOVE_DEMO_DATA_ROUTE_PATH,
  SEED_DEMO_DATA_ROUTE_PATH,
} from 'src/constants/demo-data.constant';

import { postRoute } from './post-sync-route';
import { query } from './sales-core-helpers';
import { SEEDED_MANAGER_EMAIL, signIn } from './seeded-sessions';

const DEMO_FILTER = { proopcoId: { like: 'demo-%' } };

const countDemoRecords = async () => {
  const result = await query({
    people: { __args: { filter: DEMO_FILTER }, totalCount: true },
    tradingAccounts: { __args: { filter: DEMO_FILTER }, totalCount: true },
    payments: { __args: { filter: DEMO_FILTER }, totalCount: true },
    followups: {
      __args: { filter: { trader: { proopcoId: { like: 'demo-%' } } } },
      totalCount: true,
    },
    commissions: {
      __args: { filter: { payment: { proopcoId: { like: 'demo-%' } } } },
      totalCount: true,
    },
  });

  return {
    traders: result.people.totalCount,
    tradingAccounts: result.tradingAccounts.totalCount,
    payments: result.payments.totalCount,
    followups: result.followups.totalCount,
    commissions: result.commissions.totalCount,
  };
};

describe('demo data', () => {
  it('seeds every object once, even when run twice, and removes it all', async () => {
    const headers = {
      Authorization: `Bearer ${await signIn(SEEDED_MANAGER_EMAIL)}`,
    };

    for (let run = 0; run < 2; run += 1) {
      const seed = await postRoute({
        path: SEED_DEMO_DATA_ROUTE_PATH,
        headers,
        body: {},
      });

      expect(seed.data).toEqual({ success: true });
    }

    expect(await countDemoRecords()).toEqual({
      traders: 3,
      tradingAccounts: 2,
      payments: 2,
      followups: 2,
      commissions: 1,
    });

    const month = new Date().toISOString().slice(0, 7);
    const { monthlyIncomes } = await query({
      monthlyIncomes: {
        __args: { filter: { month: { eq: month } } },
        totalCount: true,
      },
    });

    expect(monthlyIncomes.totalCount).toBeGreaterThan(0);

    const remove = await postRoute({
      path: REMOVE_DEMO_DATA_ROUTE_PATH,
      headers,
      body: {},
    });

    expect(remove.data).toMatchObject({ success: true });
    expect(await countDemoRecords()).toEqual({
      traders: 0,
      tradingAccounts: 0,
      payments: 0,
      followups: 0,
      commissions: 0,
    });
  });
});
