import { describe, expect, it } from 'vitest';

import { decidePurchase } from 'src/logic-functions/utils/decide-purchase.util';
import { isActiveAccountStatus } from 'src/logic-functions/utils/detect-lost-account.util';
import { planFollowupSweep } from 'src/logic-functions/utils/plan-followup-sweep.util';
import { computeCommissionUsdt } from 'src/utils/commission.util';

describe('computeCommissionUsdt', () => {
  it('pays 2% (CS1: 500 + 300 + 200 USDT earns 20)', () => {
    expect([500, 300, 200].map(computeCommissionUsdt)).toEqual([10, 6, 4]);
  });

  it('rounds on micros', () => {
    expect(computeCommissionUsdt(0.333333)).toBe(0.006667);
  });
});

describe('decidePurchase', () => {
  it.each([
    ['PENDING_FIRST_CALL', 'CAMPAIGN', { type: 'PURCHASE_BEFORE_CALL' }],
    ['IN_FOLLOWUP', 'CAMPAIGN', { type: 'SUCCESS', commissionKind: 'CAMPAIGN_SUCCESS' }],
    ['IN_FOLLOWUP', 'REBUY', { type: 'SUCCESS', commissionKind: 'REBUY_SUCCESS' }],
    ['REBUY_PENDING', 'REBUY', { type: 'SUCCESS', commissionKind: 'REBUY_SUCCESS' }],
    ['SUCCESSFUL', null, { type: 'RETENTION', commissionKind: 'RETENTION' }],
    [null, null, { type: 'NOTHING' }],
  ])('%s / %s', (ownershipState, followupKind, expected) => {
    expect(decidePurchase({ ownershipState, followupKind })).toEqual(expected);
  });
});

describe('isActiveAccountStatus', () => {
  it.each([
    ['active', true],
    [' Active ', true],
    ['breached', false],
    [null, false],
  ])('%s', (status, expected) => {
    expect(isActiveAccountStatus(status)).toBe(expected);
  });
});

describe('planFollowupSweep for a waiting rebuy case', () => {
  const now = new Date('2026-01-10T00:00:00Z');

  it('releases it after 72h without a cooldown', () => {
    const plan = planFollowupSweep({
      status: 'REBUY_PENDING',
      deadlineAt: '2026-01-09T00:00:00Z',
      cooldownDays: 30,
      now,
    });

    expect(plan?.followup).toMatchObject({ status: 'RELEASED_72H', openKey: null });
    expect(plan?.ownership).toMatchObject({ endReason: 'RELEASED_72H' });
    expect(plan?.person).toEqual({ currentOwnerId: null });
  });

  it('leaves it alone before the deadline', () => {
    expect(
      planFollowupSweep({ status: 'REBUY_PENDING', deadlineAt: '2026-01-11T00:00:00Z', cooldownDays: 30, now }),
    ).toBeNull();
  });
});
