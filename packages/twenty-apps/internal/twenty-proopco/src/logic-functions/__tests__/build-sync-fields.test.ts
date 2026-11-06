import { describe, expect, it } from 'vitest';

import { buildSyncFields } from 'src/logic-functions/utils/build-sync-fields.util';
import { SyncItemError } from 'src/logic-functions/utils/sync-item-error.util';

describe('buildSyncFields', () => {
  it('stores payment amounts as the toman and USDT proopco converted', () => {
    const { fields, references } = buildSyncFields('payment', {
      userProopcoId: 'u1',
      accountProopcoId: 'a1',
      amountToman: 8_500_000,
      amountUsdt: 149.99,
      paidAt: '2026-01-02T03:04:05Z',
    });

    expect(fields).toEqual({
      amountToman: 8_500_000,
      amountUsdt: 149.99,
      paidAt: '2026-01-02T03:04:05.000Z',
    });
    expect(references).toEqual({
      userId: { collection: 'people', proopcoId: 'u1' },
      challengeAccountId: { collection: 'challengeAccounts', proopcoId: 'a1' },
    });
  });

  it.each([
    [{ amountUsdt: 1, paidAt: '2026-01-02T03:04:05Z' }],
    [{ amountToman: 1, paidAt: '2026-01-02T03:04:05Z' }],
    [{ amountToman: 1, amountUsdt: 1 }],
    [{ amountToman: '1', amountUsdt: 1, paidAt: '2026-01-02T03:04:05Z' }],
    [{ amountToman: 1, amountUsdt: 1, paidAt: 'yesterday' }],
  ])('rejects the payment %j without retry', (data) => {
    expect(() =>
      buildSyncFields('payment', { userProopcoId: 'u1', ...data }),
    ).toThrow(expect.objectContaining({ retryable: false }));
  });

  it('mirrors account status and failure reason, clearing with null', () => {
    const { fields } = buildSyncFields('account', {
      userProopcoId: 'u1',
      status: 'failed',
      failureReason: null,
    });

    expect(fields).toEqual({ status: 'failed', failureReason: null });
  });

  it('requires the user reference on an account', () => {
    expect(() => buildSyncFields('account', {})).toThrow(SyncItemError);
  });

  it('only writes the user fields it was given', () => {
    const { fields, references } = buildSyncFields('user', {
      firstName: 'Ada',
      phoneNumber: '9120000000',
      phoneCallingCode: '+98',
      birthday: '1990-05-17',
      isReferral: true,
      totalPaidUsdt: 10.5,
      lastLoginAt: null,
    });

    expect(fields).toEqual({
      name: { firstName: 'Ada' },
      phones: { primaryPhoneNumber: '9120000000', primaryPhoneCallingCode: '+98' },
      birthday: '1990-05-17',
      isReferral: true,
      totalPaidUsdt: 10.5,
      lastLoginAt: null,
    });
    expect(references).toEqual({});
  });

  it.each([
    [{ birthday: '17/05/1990' }],
    [{ isReferral: 'yes' }],
    [{ purchaseCount: Number.NaN }],
  ])('rejects the user %j without retry', (data) => {
    expect(() => buildSyncFields('user', data)).toThrow(
      expect.objectContaining({ retryable: false }),
    );
  });
});
