import { DEMO_PROOPCO_ID_PREFIX } from 'src/constants/demo-data.constant';
import { createMonthlyIncomes } from 'src/logic-functions/utils/create-monthly-incomes.util';
import {
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/list-records.util';

const DEMO_FILTER = { proopcoId: { like: `${DEMO_PROOPCO_ID_PREFIX}%` } };

const destroyAll = async (
  client: RecordsClient,
  singular: string,
  ids: string[],
) => {
  for (const id of ids) {
    await client.mutation({
      [`destroy${singular}`]: { __args: { id }, id: true },
    });
  }
};

const idsOf = (nodes: { id: string }[]) => nodes.map(({ id }) => id);

export const removeDemoData = async ({
  client,
}: {
  client: RecordsClient;
}): Promise<{ removed: number }> => {
  const traderIds = idsOf(await listRecords(client, 'people', DEMO_FILTER, {}));
  const paymentIds = idsOf(
    await listRecords(client, 'payments', DEMO_FILTER, {}),
  );
  const commissions = paymentIds.length
    ? await listRecords<{ id: string; monthlyIncomeId: string | null }>(
        client,
        'commissions',
        { paymentId: { in: paymentIds } },
        { monthlyIncomeId: true },
      )
    : [];
  const followupIds = traderIds.length
    ? idsOf(
        await listRecords(
          client,
          'followups',
          {
            traderId: { in: traderIds },
          },
          {},
        ),
      )
    : [];
  const tradingAccountIds = idsOf(
    await listRecords(client, 'tradingAccounts', DEMO_FILTER, {}),
  );

  await destroyAll(client, 'Commission', idsOf(commissions));
  await destroyAll(client, 'Followup', followupIds);
  await destroyAll(client, 'Payment', paymentIds);
  await destroyAll(client, 'TradingAccount', tradingAccountIds);
  await destroyAll(client, 'Person', traderIds);

  const monthlyIncomeIds = [
    ...new Set(
      commissions.flatMap(({ monthlyIncomeId }) =>
        monthlyIncomeId ? [monthlyIncomeId] : [],
      ),
    ),
  ];
  const months = new Set<string>();

  for (const monthlyIncomeId of monthlyIncomeIds) {
    const [monthlyIncome] = await listRecords<{ month: string }>(
      client,
      'monthlyIncomes',
      { id: { eq: monthlyIncomeId } },
      { month: true },
    );
    const remaining = await listRecords(
      client,
      'commissions',
      {
        monthlyIncomeId: { eq: monthlyIncomeId },
      },
      {},
    );

    if (remaining.length === 0) {
      await destroyAll(client, 'MonthlyIncome', [monthlyIncomeId]);
    } else if (monthlyIncome) {
      months.add(monthlyIncome.month);
    }
  }

  // Real Commissions share these Monthly Incomes, so their totals are recomputed.
  for (const month of months) {
    await createMonthlyIncomes({ client, month });
  }

  return {
    removed:
      traderIds.length +
      paymentIds.length +
      commissions.length +
      followupIds.length +
      tradingAccountIds.length,
  };
};
