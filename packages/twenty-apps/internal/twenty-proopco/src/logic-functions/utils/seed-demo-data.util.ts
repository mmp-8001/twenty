import { DEMO_PROOPCO_ID_PREFIX } from 'src/constants/demo-data.constant';
import { type ProopcoSyncItem } from 'src/logic-functions/types/proopco-sync.type';
import { createCommissionForPayment } from 'src/logic-functions/utils/create-commission-for-payment.util';
import { createMonthlyIncomes } from 'src/logic-functions/utils/create-monthly-incomes.util';
import {
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/list-records.util';
import { processProopcoSyncItem } from 'src/logic-functions/utils/process-proopco-sync-item.util';
import { type MoneySettings } from 'src/logic-functions/utils/read-app-settings.util';
import { trackTrader } from 'src/logic-functions/utils/track-trader.util';

const demoId = (name: string) => `${DEMO_PROOPCO_ID_PREFIX}${name}`;

const DEMO_TRADER = { source: 'demo', labels: ['demo'] };

const DEMO_TRADERS_AND_ACCOUNTS: ProopcoSyncItem[] = [
  {
    type: 'trader',
    proopcoId: demoId('trader-1'),
    data: {
      ...DEMO_TRADER,
      firstName: 'علی',
      lastName: 'رضایی',
      email: 'ali.rezaei@example.com',
      phoneNumber: '9121234567',
      phoneCallingCode: '+98',
      isVip: true,
    },
  },
  {
    type: 'trader',
    proopcoId: demoId('trader-2'),
    data: {
      ...DEMO_TRADER,
      firstName: 'سارا',
      lastName: 'محمدی',
      email: 'sara.mohammadi@example.com',
      phoneNumber: '9351234567',
      phoneCallingCode: '+98',
      referredByProopcoId: demoId('trader-1'),
    },
  },
  {
    type: 'trader',
    proopcoId: demoId('trader-3'),
    data: {
      ...DEMO_TRADER,
      firstName: 'رضا',
      lastName: 'کریمی',
      email: 'reza.karimi@example.com',
    },
  },
  {
    type: 'tradingAccount',
    proopcoId: demoId('account-1'),
    data: {
      traderProopcoId: demoId('trader-1'),
      status: 'active',
      phase: 'phase_1',
    },
  },
  {
    type: 'tradingAccount',
    proopcoId: demoId('account-2'),
    data: {
      traderProopcoId: demoId('trader-2'),
      status: 'failed',
      phase: 'phase_1',
      failureReason: 'Daily drawdown limit',
    },
  },
];

// Dated when built, after the Followups exist, so the Commission tier day is not negative.
const buildDemoPayments = (paidAt: string): ProopcoSyncItem[] => [
  {
    type: 'payment',
    proopcoId: demoId('payment-1'),
    data: {
      traderProopcoId: demoId('trader-1'),
      tradingAccountProopcoId: demoId('account-1'),
      amountUsd: 199,
      kind: 'purchase',
      paidAt,
    },
  },
  {
    type: 'payment',
    proopcoId: demoId('payment-2'),
    data: {
      traderProopcoId: demoId('trader-3'),
      amountUsd: 99,
      kind: 'purchase',
      paidAt,
    },
  },
];

const findIdByProopcoId = async (
  client: RecordsClient,
  collection: string,
  proopcoId: string,
) =>
  (
    await listRecords<{ id: string }>(
      client,
      collection,
      {
        proopcoId: { eq: proopcoId },
      },
      {},
    )
  )[0]?.id;

// Idempotent: records are upserted by proopcoId and every later step skips existing work.
export const seedDemoData = async ({
  client,
  ownerId,
  settings,
  now,
}: {
  client: RecordsClient;
  ownerId: string;
  settings: MoneySettings;
  now: Date;
}): Promise<{ errors: string[] }> => {
  const errors: string[] = [];
  const syncItems = async (items: ProopcoSyncItem[]) => {
    for (const item of items) {
      const result = await processProopcoSyncItem(client, item);

      if (result.status === 'error') {
        errors.push(`${item.proopcoId}: ${result.reason}`);
      }
    }
  };

  await syncItems(DEMO_TRADERS_AND_ACCOUNTS);

  for (const name of ['trader-1', 'trader-2']) {
    const traderId = await findIdByProopcoId(client, 'people', demoId(name));

    const hasFollowup =
      traderId &&
      (
        await listRecords(
          client,
          'followups',
          {
            traderId: { eq: traderId },
          },
          {},
        )
      ).length > 0;

    if (!traderId || hasFollowup) {
      continue;
    }

    const tracked = await trackTrader({ client, traderId, ownerId, now });

    if (!tracked.success) {
      errors.push(`${demoId(name)} Followup: ${tracked.error}`);
    }
  }

  await syncItems(buildDemoPayments(new Date().toISOString()));

  const paymentId = await findIdByProopcoId(
    client,
    'payments',
    demoId('payment-1'),
  );

  if (paymentId) {
    const result = await createCommissionForPayment({
      client,
      paymentId,
      settings,
      now,
    });

    if (result.status === 'error') {
      errors.push(`Commission: ${result.reason}`);
    }
  }

  await createMonthlyIncomes({ client, month: now.toISOString().slice(0, 7) });

  return { errors };
};
