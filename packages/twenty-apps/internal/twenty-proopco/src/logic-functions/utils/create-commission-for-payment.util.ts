import {
  computeCommissionMicros,
  countWholeDays,
  findCommissionTier,
  type CommissionTierRecord,
} from 'src/logic-functions/utils/commission-rules.util';
import {
  createRecord,
  listRecords,
  updateRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/list-records.util';
import { type MoneySettings } from 'src/logic-functions/utils/read-app-settings.util';

export type CommissionResult =
  | { status: 'created'; commissionId: string }
  | { status: 'skipped'; reason: string }
  | { status: 'error'; reason: string };

type PaymentNode = {
  proopcoId: string;
  kind: string | null;
  paidAt: string | null;
  traderId: string | null;
  tradingAccountId: string | null;
  amount: { amountMicros: string | number | null } | null;
};

type FollowupNode = {
  id: string;
  stage: string;
  createdAt: string;
  expiresAt: string | null;
  ownerId: string | null;
  followupTypeId: string | null;
};

type CommissionNode = {
  rateApplied: number;
  tierName: string;
  ownerId: string | null;
  followupId: string | null;
  paymentId: string;
};

const isPurchaseLike = (kind: string | null) =>
  kind === 'PURCHASE' || kind === 'INSTALLMENT_INITIAL';

const skipped = (reason: string): CommissionResult => ({
  status: 'skipped',
  reason,
});

export const createCommissionForPayment = async ({
  client,
  paymentId,
  settings,
  now,
}: {
  client: RecordsClient;
  paymentId: string;
  settings: MoneySettings;
  now: Date;
}): Promise<CommissionResult> => {
  const [payment] = await listRecords<PaymentNode>(
    client,
    'payments',
    { id: { eq: paymentId } },
    {
      proopcoId: true,
      kind: true,
      paidAt: true,
      traderId: true,
      tradingAccountId: true,
      amount: { amountMicros: true },
    },
  );

  if (!payment) {
    return { status: 'error', reason: 'Payment not found' };
  }

  if (!payment.traderId) {
    return skipped('Payment has no Trader');
  }

  const existing = await listRecords(client, 'commissions', {
    paymentId: { eq: paymentId },
  }, {});

  if (existing.length > 0) {
    return skipped('Payment already has a Commission');
  }

  if (settings.basis === 'list_price') {
    return {
      status: 'error',
      reason: 'COMMISSION_BASIS list_price needs a challenge list price, which proopco does not sync yet',
    };
  }

  const paidAt = payment.paidAt ?? now.toISOString();
  const baseMicros = Number(payment.amount?.amountMicros ?? 0);
  const tiers = await listRecords<CommissionTierRecord>(
    client,
    'commissionTiers',
    {},
    { name: true, minDay: true, maxDay: true, rate: true },
  );

  const store = async ({
    followupId,
    ownerId,
    rate,
    tierName,
  }: {
    followupId: string | null;
    ownerId: string | null;
    rate: number;
    tierName: string;
  }): Promise<CommissionResult> => {
    try {
      const commissionId = await createRecord(client, 'Commission', {
        name: `Commission ${payment.proopcoId}`,
        paymentId,
        followupId,
        ownerId,
        amount: {
          amountMicros: computeCommissionMicros(baseMicros, rate),
          currencyCode: 'USD',
        },
        rateApplied: rate,
        tierName,
        basis: settings.basis,
        scope: settings.scope,
      });

      return { status: 'created', commissionId };
    } catch (error) {
      // The unique index on the Payment relation wins a replay race.
      const existingNow = await listRecords(client, 'commissions', {
        paymentId: { eq: paymentId },
      }, {});

      if (existingNow.length > 0) {
        return skipped('Payment already has a Commission');
      }

      throw error;
    }
  };

  if (payment.kind === 'INSTALLMENT_REMAINING') {
    if (!settings.installmentRemainingEarns) {
      return skipped('INSTALLMENT_REMAINING_EARNS is off');
    }

    const siblings = await listRecords<{ id: string; kind: string | null }>(
      client,
      'payments',
      payment.tradingAccountId
        ? { tradingAccountId: { eq: payment.tradingAccountId } }
        : { traderId: { eq: payment.traderId } },
      { kind: true },
    );
    const initial = siblings.find(({ kind }) => kind === 'INSTALLMENT_INITIAL');
    const [initialCommission] = initial
      ? await listRecords<CommissionNode>(
          client,
          'commissions',
          { paymentId: { eq: initial.id } },
          { rateApplied: true, tierName: true, ownerId: true, followupId: true },
        )
      : [];

    if (!initialCommission) {
      return skipped('The initial installment earned no Commission');
    }

    // The rate was promised at the sale, so the remaining payment keeps it.
    return store({
      followupId: initialCommission.followupId,
      ownerId: initialCommission.ownerId,
      rate: initialCommission.rateApplied,
      tierName: initialCommission.tierName,
    });
  }

  if (!isPurchaseLike(payment.kind)) {
    return skipped('Payment kind does not earn Commission');
  }

  const followups = await listRecords<FollowupNode>(
    client,
    'followups',
    { traderId: { eq: payment.traderId } },
    { stage: true, createdAt: true, expiresAt: true, ownerId: true, followupTypeId: true },
  );
  const followup = followups.find(
    ({ stage, expiresAt }) =>
      stage === 'PENDING' ||
      stage === 'RETRY_PENDING' ||
      (settings.scope === 'all_purchases_in_window' &&
        stage === 'SUCCEEDED' &&
        expiresAt !== null &&
        new Date(expiresAt) >= new Date(paidAt)),
  );

  if (!followup) {
    return skipped('Trader has no Followup in its window');
  }

  const followupId = followup.id;
  const [followupType] = followup.followupTypeId
    ? await listRecords<{ commissionable: boolean }>(
        client,
        'followupTypes',
        { id: { eq: followup.followupTypeId } },
        { commissionable: true },
      )
    : [];
  const tier = findCommissionTier(
    tiers,
    countWholeDays(followup.createdAt, paidAt),
  );

  let result: CommissionResult = skipped(
    !followupType?.commissionable
      ? 'Followup Type is not commissionable'
      : !tier
        ? 'No Commission Tier matches'
        : 'Followup has no owner',
  );

  if (followupType?.commissionable && tier && followup.ownerId) {
    result = await store({
      followupId,
      ownerId: followup.ownerId,
      rate: tier.rate,
      tierName: tier.name,
    });
  }

  if (followup.stage !== 'SUCCEEDED') {
    await updateRecord(client, 'Followup', followupId, {
      stage: 'SUCCEEDED',
      retryExpiresAt: null,
    });
  }

  return result;
};
