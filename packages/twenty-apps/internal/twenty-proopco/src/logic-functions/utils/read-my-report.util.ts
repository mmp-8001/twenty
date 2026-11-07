import { listRecords, type RecordsClient } from 'src/logic-functions/utils/list-records.util';
import { readReportData } from 'src/logic-functions/utils/read-report.util';
import { buildReport, reportRangeOf } from 'src/utils/build-report.util';
import { type ReportPeriod } from 'src/constants/income-report.constant';

// The caller's own numbers, their Commissions and their monthly incomes with payment status.
export const readMyReport = async ({
  client,
  memberId,
  period,
  now = new Date(),
}: {
  client: RecordsClient;
  memberId: string;
  period: ReportPeriod;
  now?: Date;
}) => {
  const range = reportRangeOf(period, now);
  const data = await readReportData({ client, adminId: memberId, range });
  const [commissions, incomes] = await Promise.all([
    listRecords<{ purchasedAt: string | null; amountUsdt: number | null; commissionUsdt: number | null }>(
      client,
      'commissions',
      {
        and: [
          { adminId: { eq: memberId } },
          ...(range.start
            ? [{ purchasedAt: { gte: range.start.toISOString() } }, { purchasedAt: { lt: range.end.toISOString() } }]
            : []),
        ],
      },
      { purchasedAt: true, amountUsdt: true, commissionUsdt: true },
    ),
    listRecords<{ jalaliYear: number | null; jalaliMonth: number | null; totalUsdt: number | null; status: string | null }>(
      client,
      'monthlyIncomes',
      { adminId: { eq: memberId } },
      { jalaliYear: true, jalaliMonth: true, totalUsdt: true, status: true },
    ),
  ]);

  return {
    success: true as const,
    period,
    start: range.start?.toISOString() ?? null,
    end: range.end.toISOString(),
    report: buildReport({ data, adminId: memberId, range, now }),
    commissions,
    incomes,
  };
};
