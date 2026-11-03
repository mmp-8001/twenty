import { afterEach, describe, expect, it } from 'vitest';

import {
  commissionsOfPayment,
  createFollowup,
  createPayment,
  createTrader,
  daysFromNow,
  firstMemberId,
  getFollowup,
  mutate,
  query,
  runCommission,
  setAppVariable,
  waitFor,
} from './sales-core-helpers';

const microsOf = (commission: Record<string, any>) =>
  Number(commission.amount.amountMicros);

// Followup created `daysAgo` whole days before now (plus a margin against clock skew).
const followupCreatedDaysAgo = async (
  suffix: string,
  daysAgo: number,
  extra: { typeName?: string; ownerId?: string | null } = {},
) => {
  const traderId = await createTrader(suffix);
  const ownerId = extra.ownerId === undefined ? await firstMemberId() : extra.ownerId;
  const followupId = await createFollowup({
    traderId,
    ownerId,
    typeName: extra.typeName,
    createdAt: daysFromNow(-daysAgo, Date.now() - 3_600_000),
    expiresAt: daysFromNow(60),
  });

  return { traderId, ownerId, followupId };
};

describe('Commission rules', () => {
  afterEach(async () => {
    await setAppVariable('COMMISSION_SCOPE', 'first_purchase');
    await setAppVariable('INSTALLMENT_REMAINING_EARNS', 'true');
    await setAppVariable('COMMISSION_BASIS', 'paid_amount');
  });

  it('pays the tier matching the days since the Followup, on the paid amount', async () => {
    const { traderId, followupId, ownerId } = await followupCreatedDaysAgo('tier-low', 3);
    const paymentId = await createPayment({ traderId, amountUsd: 200 });

    await runCommission(paymentId);

    const [commission] = await commissionsOfPayment(paymentId);

    expect(commission).toMatchObject({
      ownerId,
      followupId,
      rateApplied: 0.1,
      tierName: 'Days 0-7',
      basis: 'paid_amount',
      scope: 'first_purchase',
    });
    expect(microsOf(commission)).toBe(20_000_000);
    expect(commission.amount.currencyCode).toBe('USD');
    expect(await getFollowup(followupId)).toMatchObject({ stage: 'SUCCEEDED' });
  });

  it.each([
    [7, 'Days 0-7'],
    [8, 'Days 8-14'],
    [14, 'Days 8-14'],
    [15, 'Days 15-30'],
    [30, 'Days 15-30'],
  ])('uses the inclusive tier bounds at day %i', async (daysAgo, tierName) => {
    const { traderId } = await followupCreatedDaysAgo(`bound-${daysAgo}`, daysAgo);
    const paymentId = await createPayment({ traderId, amountUsd: 100 });

    await runCommission(paymentId);

    expect((await commissionsOfPayment(paymentId))[0]?.tierName).toBe(tierName);
  });

  it('pays nothing but still closes the Followup when no tier matches', async () => {
    const { traderId, followupId } = await followupCreatedDaysAgo('no-tier', 45);
    const paymentId = await createPayment({ traderId, amountUsd: 100 });

    await runCommission(paymentId);

    expect(await commissionsOfPayment(paymentId)).toHaveLength(0);
    expect(await getFollowup(followupId)).toMatchObject({ stage: 'SUCCEEDED' });
  });

  it('pays nothing for a Followup Type that is not commissionable', async () => {
    const { traderId, followupId } = await followupCreatedDaysAgo('support', 1, {
      typeName: 'Support',
    });
    const paymentId = await createPayment({ traderId, amountUsd: 100 });

    await runCommission(paymentId);

    expect(await commissionsOfPayment(paymentId)).toHaveLength(0);
    expect(await getFollowup(followupId)).toMatchObject({ stage: 'SUCCEEDED' });
  });

  it('pays nothing to a Trader without a Followup', async () => {
    const paymentId = await createPayment({
      traderId: await createTrader('untracked'),
      amountUsd: 100,
    });

    await runCommission(paymentId);

    expect(await commissionsOfPayment(paymentId)).toHaveLength(0);
  });

  it('never produces two Commissions for one Payment', async () => {
    const { traderId } = await followupCreatedDaysAgo('twice', 1);
    const paymentId = await createPayment({ traderId, amountUsd: 100 });

    await Promise.all([runCommission(paymentId), runCommission(paymentId)]);
    await runCommission(paymentId);

    expect(await commissionsOfPayment(paymentId)).toHaveLength(1);
  });

  it('keeps the earned rate when the tier is edited later', async () => {
    const { traderId } = await followupCreatedDaysAgo('copy', 20);
    const paymentId = await createPayment({ traderId, amountUsd: 100 });

    await runCommission(paymentId);

    const { commissionTiers } = await query({
      commissionTiers: {
        __args: { filter: { name: { eq: 'Days 15-30' } } },
        edges: { node: { id: true } },
      },
    });
    const tierId = commissionTiers.edges[0].node.id;

    await mutate({
      updateCommissionTier: { __args: { id: tierId, data: { rate: 0.5 } }, id: true },
    });

    try {
      const [commission] = await commissionsOfPayment(paymentId);

      expect(commission.rateApplied).toBe(0.05);
      expect(microsOf(commission)).toBe(5_000_000);
    } finally {
      await mutate({
        updateCommissionTier: { __args: { id: tierId, data: { rate: 0.05 } }, id: true },
      });
    }
  });

  it('under first_purchase, a later purchase earns nothing', async () => {
    const { traderId } = await followupCreatedDaysAgo('first-only', 2);
    const first = await createPayment({ traderId, amountUsd: 100 });
    const second = await createPayment({ traderId, amountUsd: 100 });

    await runCommission(first);
    await runCommission(second);

    expect(await commissionsOfPayment(first)).toHaveLength(1);
    expect(await commissionsOfPayment(second)).toHaveLength(0);
  });

  it('under all_purchases_in_window, every purchase earns', async () => {
    await setAppVariable('COMMISSION_SCOPE', 'all_purchases_in_window');

    const { traderId } = await followupCreatedDaysAgo('all-window', 2);
    const first = await createPayment({ traderId, amountUsd: 100 });
    const second = await createPayment({ traderId, amountUsd: 300 });

    await runCommission(first);
    await runCommission(second);

    expect(await commissionsOfPayment(first)).toHaveLength(1);

    const [secondCommission] = await commissionsOfPayment(second);

    expect(secondCommission.scope).toBe('all_purchases_in_window');
    expect(microsOf(secondCommission)).toBe(30_000_000);
  });

  it('pays the remaining installment when the initial one earned and the flag is on', async () => {
    const { traderId } = await followupCreatedDaysAgo('installment', 2);
    const initial = await createPayment({ traderId, kind: 'INSTALLMENT_INITIAL', amountUsd: 100 });
    const remaining = await createPayment({ traderId, kind: 'INSTALLMENT_REMAINING', amountUsd: 200 });

    await runCommission(initial);
    await runCommission(remaining);

    const [commission] = await commissionsOfPayment(remaining);

    expect(commission).toMatchObject({ rateApplied: 0.1, tierName: 'Days 0-7' });
    expect(microsOf(commission)).toBe(20_000_000);
  });

  it('skips the remaining installment when the flag is off', async () => {
    await setAppVariable('INSTALLMENT_REMAINING_EARNS', 'false');

    const { traderId } = await followupCreatedDaysAgo('installment-off', 2);
    const initial = await createPayment({ traderId, kind: 'INSTALLMENT_INITIAL', amountUsd: 100 });
    const remaining = await createPayment({ traderId, kind: 'INSTALLMENT_REMAINING', amountUsd: 200 });

    await runCommission(initial);
    await runCommission(remaining);

    expect(await commissionsOfPayment(initial)).toHaveLength(1);
    expect(await commissionsOfPayment(remaining)).toHaveLength(0);
  });

  it('skips the remaining installment when the initial one earned nothing', async () => {
    const traderId = await createTrader('installment-orphan');
    const initial = await createPayment({ traderId, kind: 'INSTALLMENT_INITIAL', amountUsd: 100 });
    const remaining = await createPayment({ traderId, kind: 'INSTALLMENT_REMAINING', amountUsd: 200 });

    await runCommission(initial);
    await runCommission(remaining);

    expect(await commissionsOfPayment(remaining)).toHaveLength(0);
  });

  it('refuses to run while a required variable is unset', async () => {
    const { traderId } = await followupCreatedDaysAgo('unset', 1);
    const paymentId = await createPayment({ traderId, amountUsd: 100 });

    await setAppVariable('COMMISSION_SCOPE', '');

    const result = await runCommission(paymentId);

    expect(result).toMatchObject({
      status: 'error',
      reason: expect.stringContaining('COMMISSION_SCOPE'),
    });
    expect(await commissionsOfPayment(paymentId)).toHaveLength(0);
  });

  it('refuses the list_price basis, which proopco does not sync', async () => {
    await setAppVariable('COMMISSION_BASIS', 'list_price');

    const { traderId } = await followupCreatedDaysAgo('list-price', 1);
    const paymentId = await createPayment({ traderId, amountUsd: 100 });

    expect(await runCommission(paymentId)).toMatchObject({ status: 'error' });
  });
});

describe('Payment created workflow', () => {
  it('creates the Commission without any direct call', async () => {
    const { traderId, followupId } = await followupCreatedDaysAgo('workflow', 2);
    const paymentId = await createPayment({ traderId, amountUsd: 100 });
    const commission = await waitFor(async () => (await commissionsOfPayment(paymentId))[0]);

    expect(microsOf(commission)).toBe(10_000_000);
    expect(await getFollowup(followupId)).toMatchObject({ stage: 'SUCCEEDED' });
  });
});
