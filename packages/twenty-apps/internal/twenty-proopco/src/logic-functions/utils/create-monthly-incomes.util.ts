import {
  createRecord,
  listRecords,
  type RecordsClient,
  updateRecord,
  updateRecordsWhere,
} from 'src/logic-functions/utils/list-records.util';
import { jalaliMonthBounds, previousJalaliMonth } from 'src/utils/jalali.util';
import {
  buildIncomeKey,
  fromMicros,
  groupCommissionsByAdmin,
  toMicros,
} from 'src/utils/monthly-income.util';

type IncomeRow = { id: string; status: string | null };

const findIncome = async (client: RecordsClient, incomeKey: string) =>
  (await listRecords<IncomeRow>(client, 'monthlyIncomes', { incomeKey: { eq: incomeKey } }, { status: true }))[0];

// The previous Jalali month's unassigned Commissions become one pending income per Admin.
// A second run finds nothing unassigned and creates nothing; a PAID income is never reopened.
export const createMonthlyIncomes = async ({
  client,
  now = new Date(),
}: {
  client: RecordsClient;
  now?: Date;
}): Promise<{ year: number; month: number; incomes: number }> => {
  const { year, month } = previousJalaliMonth(now);
  const { start, end } = jalaliMonthBounds(year, month);
  const commissions = await listRecords<{ id: string; adminId: string | null; commissionUsdt: number | null }>(
    client,
    'commissions',
    {
      and: [
        { purchasedAt: { gte: start.toISOString() } },
        { purchasedAt: { lt: end.toISOString() } },
        { monthlyIncomeId: { is: 'NULL' } },
      ],
    },
    { adminId: true, commissionUsdt: true },
  );
  let incomes = 0;

  for (const [adminId, group] of groupCommissionsByAdmin(
    commissions,
  )) {
    const incomeKey = buildIncomeKey(adminId, year, month);
    let income = await findIncome(client, incomeKey);

    if (income?.status === 'PAID') {
      continue;
    }

    if (!income) {
      try {
        const id = await createRecord(client, 'MonthlyIncome', {
          incomeKey,
          adminId,
          jalaliYear: year,
          jalaliMonth: month,
          totalUsdt: 0,
          status: 'PENDING',
        });

        income = { id, status: 'PENDING' };
      } catch (error) {
        // A concurrent run created it first (unique incomeKey); use theirs.
        income = await findIncome(client, incomeKey);

        if (!income) {
          throw error;
        }
      }
    }

    await updateRecordsWhere(
      client,
      'commissions',
      { id: { in: group.ids }, monthlyIncomeId: { is: 'NULL' } },
      { monthlyIncomeId: income.id },
    );

    // The total is re-summed from everything linked, so a crash between steps heals on the next run.
    const linked = await listRecords<{ commissionUsdt: number | null }>(
      client,
      'commissions',
      { monthlyIncomeId: { eq: income.id } },
      { commissionUsdt: true },
    );

    await updateRecord(client, 'MonthlyIncome', income.id, {
      totalUsdt: fromMicros(linked.reduce((sum, { commissionUsdt }) => sum + toMicros(commissionUsdt), 0)),
    });
    incomes += 1;
  }

  return { year, month, incomes };
};
