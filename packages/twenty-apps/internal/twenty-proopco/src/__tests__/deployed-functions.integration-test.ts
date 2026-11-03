import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { describe, expect, it } from 'vitest';

import { postSyncRoute } from './post-sync-route';
import { readManifestLogicFunctionNamesOrThrow } from './read-manifest-logic-function-names-or-throw';
import { TEST_SYNC_TOKEN } from './test-constants';

const runId = Date.now().toString(36);
const id = (name: string) => `${name}-${runId}`;

const sync = async (
  items: unknown[],
  token: string | null = TEST_SYNC_TOKEN,
) => {
  const execution = await postSyncRoute({
    headers: token === null ? {} : { 'x-proopco-sync-token': token },
    body: { items },
  });

  expect(execution.status).toBe(200);

  return execution.data as {
    success: boolean;
    error?: string;
    results?: { status: string; reason?: string; retryable?: boolean }[];
  };
};

const trader = (suffix: string, data: Record<string, unknown> = {}) => ({
  type: 'trader',
  proopcoId: id(`trader-${suffix}`),
  data: { firstName: 'Ada', email: `${id(suffix)}@example.com`, ...data },
});

describe('twenty-proopco sync route', () => {
  it('deploys every logic function the manifest declares', async () => {
    const { findManyLogicFunctions } = await new MetadataApiClient().query({
      findManyLogicFunctions: { name: true },
    });
    const deployedNames = findManyLogicFunctions.map(
      (logicFunction: { name: string }) => logicFunction.name,
    );

    for (const name of await readManifestLogicFunctionNamesOrThrow()) {
      expect(deployedNames).toContain(name);
    }
  });

  it.each([[null], ['wrong-token']])('rejects token %s', async (token) => {
    const response = await sync([trader('rejected')], token);

    expect(response).toEqual({ success: false, error: 'Invalid sync token' });
  });

  it('creates, then reports unchanged, then updates a Trader', async () => {
    const item = trader('upsert', { purchaseCount: 1, labels: ['vip'] });

    expect((await sync([item])).results?.[0].status).toBe('created');
    expect((await sync([item])).results?.[0].status).toBe('unchanged');

    const changed = { ...item, data: { ...item.data, purchaseCount: 2 } };

    expect((await sync([changed])).results?.[0].status).toBe('updated');
  });

  it('syncs a Trading Account and a Payment linked to their Trader', async () => {
    const response = await sync([
      {
        type: 'payment',
        proopcoId: id('payment-1'),
        data: {
          traderProopcoId: id('trader-linked'),
          tradingAccountProopcoId: id('account-1'),
          amountUsd: 99.5,
          kind: 'purchase',
          paidAt: '2026-01-02T03:04:05Z',
        },
      },
      {
        type: 'tradingAccount',
        proopcoId: id('account-1'),
        data: {
          traderProopcoId: id('trader-linked'),
          status: 'failed',
          failureReason: 'max_drawdown',
        },
      },
      trader('linked'),
    ]);

    expect(response.results?.map((result) => result.status)).toEqual([
      'created',
      'created',
      'created',
    ]);

    const { payments, tradingAccounts } = await new CoreApiClient().query({
      payments: {
        __args: { filter: { proopcoId: { eq: id('payment-1') } } },
        edges: {
          node: {
            amount: { amountMicros: true, currencyCode: true },
            kind: true,
          },
        },
      },
      tradingAccounts: {
        __args: { filter: { proopcoId: { eq: id('account-1') } } },
        edges: { node: { status: true, failureReason: true } },
      },
    });

    expect(payments?.edges?.[0]?.node?.kind).toBe('PURCHASE');
    expect(payments?.edges?.[0]?.node?.amount?.currencyCode).toBe('USD');
    expect(Number(payments?.edges?.[0]?.node?.amount?.amountMicros)).toBe(99_500_000);
    expect(tradingAccounts?.edges?.[0]?.node).toEqual({
      status: 'failed',
      failureReason: 'max_drawdown',
    });
  });

  it('returns a retryable error for a missing Trader and still applies the rest', async () => {
    const response = await sync([
      {
        type: 'tradingAccount',
        proopcoId: id('account-orphan'),
        data: { traderProopcoId: id('trader-missing'), status: 'active' },
      },
      trader('beside-orphan'),
    ]);

    expect(response.results?.[0]).toMatchObject({
      status: 'error',
      retryable: true,
    });
    expect(response.results?.[1].status).toBe('created');

    const retried = await sync([
      trader('missing'),
      {
        type: 'tradingAccount',
        proopcoId: id('account-orphan'),
        data: { traderProopcoId: id('trader-missing'), status: 'active' },
      },
    ]);

    expect(retried.results?.map((result) => result.status)).toEqual([
      'created',
      'created',
    ]);
  });

  it('rejects an unknown payment kind without retry', async () => {
    const response = await sync([
      trader('kind'),
      {
        type: 'payment',
        proopcoId: id('payment-bad-kind'),
        data: {
          traderProopcoId: id('trader-kind'),
          amountUsd: 1,
          kind: 'refund',
        },
      },
    ]);

    expect(response.results?.[1]).toMatchObject({
      status: 'error',
      retryable: false,
    });
  });
});
