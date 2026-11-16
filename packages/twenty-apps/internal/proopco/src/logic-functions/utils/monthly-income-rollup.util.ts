import { isDefined } from 'twenty-sdk/utils';

import {
  listRecords,
  createRecord,
  updateRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { planMonthlyIncomes, type RollupPurchase } from 'src/utils/monthly-income.util';

const roundCents = (value: number) => Math.round(value * 100) / 100;

const totalOfLinkedPurchases = async (client: RecordsClient, monthlyIncomeId: string) =>
  roundCents(
    (
      await listRecords<{ commissionUsdt: number | null }>(client, 'purchases', { monthlyIncomeId: { eq: monthlyIncomeId } }, { commissionUsdt: true })
    ).reduce((sum, { commissionUsdt }) => sum + (commissionUsdt ?? 0), 0),
  );

// Every step is an upsert or an absolute write, and the marker moves last, so a crash or rerun repeats nothing.
export const rollUpMonthlyIncomes = async (client: RecordsClient, now: Date) => {
  const [settings] = await listRecords<{ id: string; lastRolledUpJalaliMonth: string | null }>(
    client,
    'proopcoSettingsRecords',
    {},
    { lastRolledUpJalaliMonth: true },
    1,
  );

  if (!isDefined(settings)) {
    return { created: 0, linked: 0 };
  }

  const purchases = await listRecords<RollupPurchase>(
    client,
    'purchases',
    { and: [{ monthlyIncomeId: { is: 'NULL' } }, { creditedAgentId: { is: 'NOT_NULL' } }, { commissionUsdt: { gt: 0 } }] },
    { occurredAt: true, commissionUsdt: true, creditedAgentId: true, creditedAgentMemberId: true },
  );
  const plan = planMonthlyIncomes(purchases, settings.lastRolledUpJalaliMonth, now);
  const agentNames = new Map(
    (await listRecords<{ id: string; name: string }>(client, 'agents', {}, { name: true })).map(({ id, name }) => [id, name]),
  );
  let created = 0;
  let linked = 0;

  for (const group of plan.groups) {
    const incomeKey = `${group.agentId}|${group.jalaliMonth}`;
    const [existing] = await listRecords<{ id: string }>(client, 'monthlyIncomes', { incomeKey: { eq: incomeKey } }, {}, 1);
    const incomeId =
      existing?.id ??
      (await createRecord(client, 'MonthlyIncome', {
        name: `${agentNames.get(group.agentId) ?? ''} · ${group.jalaliMonth}`,
        incomeKey,
        jalaliMonth: group.jalaliMonth,
        agentId: group.agentId,
        agentMemberId: group.agentMemberId,
        status: 'AWAITING_PAYMENT',
        totalUsdt: 0,
      }));

    created += existing ? 0 : 1;

    for (const purchaseId of group.purchaseIds) {
      await updateRecord(client, 'Purchase', purchaseId, { monthlyIncomeId: incomeId });
      linked += 1;
    }
  }

  if (plan.marker !== settings.lastRolledUpJalaliMonth) {
    // Totals come from the links of every income in the rolled range, so a crash after linking still ends with the right total.
    const incomes = await listRecords<{ id: string; jalaliMonth: string }>(client, 'monthlyIncomes', {}, { jalaliMonth: true });

    for (const income of incomes) {
      if (income.jalaliMonth > (settings.lastRolledUpJalaliMonth ?? '') && income.jalaliMonth <= (plan.marker ?? '')) {
        await updateRecord(client, 'MonthlyIncome', income.id, { totalUsdt: await totalOfLinkedPurchases(client, income.id) });
      }
    }

    await updateRecord(client, 'ProopcoSettings', settings.id, { lastRolledUpJalaliMonth: plan.marker });
  }

  return { created, linked };
};
