import { type ReportPeriod } from 'src/constants/income-report.constant';
import { listRecords, type RecordsClient } from 'src/logic-functions/utils/list-records.util';
import { readAdmins } from 'src/logic-functions/utils/read-admins.util';
import { readReportData } from 'src/logic-functions/utils/read-report.util';
import { type AdminRoleKey } from 'src/utils/admin-permissions.util';
import { buildReport, reportRangeOf } from 'src/utils/build-report.util';

// Team totals and every Admin with name and rank. Only Supervisors and the Full Admin call this.
export const readTeamReport = async ({
  client,
  roleKeys,
  period,
  now = new Date(),
}: {
  client: RecordsClient;
  roleKeys: Map<string, AdminRoleKey>;
  period: ReportPeriod;
  now?: Date;
}) => {
  const range = reportRangeOf(period, now);
  const [data, admins, pendingIncomes] = await Promise.all([
    readReportData({ client, adminId: null, range }),
    readAdmins({ client, roleKeys, now }),
    listRecords<{ id: string; adminId: string | null; jalaliYear: number | null; jalaliMonth: number | null; totalUsdt: number | null }>(
      client,
      'monthlyIncomes',
      { status: { eq: 'PENDING' } },
      { adminId: true, jalaliYear: true, jalaliMonth: true, totalUsdt: true },
    ),
  ]);
  const sellers = admins
    .filter(({ roleKey }) => roleKey !== 'FULL_ADMIN')
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    success: true as const,
    period,
    start: range.start?.toISOString() ?? null,
    end: range.end.toISOString(),
    totals: buildReport({ data, adminId: null, range, now }),
    admins: sellers.map(({ memberId, name, roleKey, status }, index) => ({
      rank: index + 1,
      memberId,
      name,
      roleKey,
      status,
      report: buildReport({ data, adminId: memberId, range, now }),
    })),
    longFreezes: admins.filter(({ isLongFreeze }) => isLongFreeze),
    pendingIncomes: pendingIncomes.map((income) => ({
      ...income,
      adminName: admins.find(({ memberId }) => memberId === income.adminId)?.name ?? null,
    })),
  };
};
