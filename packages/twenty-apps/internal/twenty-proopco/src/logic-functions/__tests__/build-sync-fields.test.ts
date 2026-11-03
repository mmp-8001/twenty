import { describe, expect, it } from 'vitest';

import { buildSyncFields } from 'src/logic-functions/utils/build-sync-fields.util';
import { SyncItemError } from 'src/logic-functions/utils/sync-item-error.util';

describe('buildSyncFields', () => {
  it('stores payment amounts in USD micros', () => {
    const { fields, references } = buildSyncFields('payment', {
      traderProopcoId: 't1',
      amountUsd: 149.99,
      kind: 'installment_initial',
      paidAt: '2026-01-02T03:04:05Z',
    });

    expect(fields).toEqual({
      amount: { amountMicros: 149_990_000, currencyCode: 'USD' },
      kind: 'INSTALLMENT_INITIAL',
      paidAt: '2026-01-02T03:04:05.000Z',
    });
    expect(references).toEqual({
      traderId: { collection: 'people', proopcoId: 't1' },
    });
  });

  it('rejects an unknown payment kind without retry', () => {
    expect(() =>
      buildSyncFields('payment', {
        traderProopcoId: 't1',
        amountUsd: 1,
        kind: 'refund',
      }),
    ).toThrow(expect.objectContaining({ retryable: false }));
  });

  it('mirrors trading account status and failure reason, clearing with null', () => {
    const { fields } = buildSyncFields('tradingAccount', {
      traderProopcoId: 't1',
      status: 'failed',
      failureReason: null,
    });

    expect(fields).toEqual({ status: 'failed', failureReason: null });
  });

  it('only writes the trader fields it was given', () => {
    const { fields, references } = buildSyncFields('trader', {
      firstName: 'Ada',
      isVip: true,
      totalSpentUsd: 10,
      referredByProopcoId: 'p9',
    });

    expect(fields).toEqual({
      name: { firstName: 'Ada' },
      isVip: true,
      totalSpent: { amountMicros: 10_000_000, currencyCode: 'USD' },
    });
    expect(references).toEqual({
      referredById: { collection: 'people', proopcoId: 'p9' },
    });
  });

  it('requires the trader reference on a trading account', () => {
    expect(() => buildSyncFields('tradingAccount', {})).toThrow(SyncItemError);
  });
});
