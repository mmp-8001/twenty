import { useCallback, useEffect, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';

import {
  MARK_INCOME_PAID_ROUTE_PATH,
  MY_REPORT_ROUTE_PATH,
  REPORT_PERIODS,
  type ReportPeriod,
  TEAM_REPORT_ROUTE_PATH,
} from 'src/constants/income-report.constant';
import { REPORTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { type readMyReport } from 'src/logic-functions/utils/read-my-report.util';
import { type readTeamReport } from 'src/logic-functions/utils/read-team-report.util';
import { type Report } from 'src/utils/build-report.util';

type RouteError = { success: false; error?: string };
type MyReport = Awaited<ReturnType<typeof readMyReport>>;
type TeamReport = Awaited<ReturnType<typeof readTeamReport>>;

const post = <TResponse,>(path: string, body: unknown) => new RestApiClient().post<TResponse>(`/s${path}`, body);

const ReportTable = ({ report }: { report: Report }) => (
  <table>
    <tbody>
      <tr><td>Follow-up calls (answered / total)</td><td>{report.calls.followup.answered} / {report.calls.followup.total} ({report.calls.followup.answerRate ?? '-'}%)</td></tr>
      <tr><td>Retention calls (answered / total)</td><td>{report.calls.retention.answered} / {report.calls.retention.total} ({report.calls.retention.answerRate ?? '-'}%)</td></tr>
      <tr><td>Cases added</td><td>{report.cases.added}</td></tr>
      <tr><td>Outcomes</td><td>{Object.entries(report.cases.outcomes).map(([status, count]) => `${status.toLowerCase()}: ${count}`).join(', ') || '-'}</td></tr>
      <tr><td>Failed by reason</td><td>{Object.entries(report.cases.failedByReason).map(([title, count]) => `${title}: ${count}`).join(', ') || '-'}</td></tr>
      <tr><td>Conversion rate</td><td>{report.conversionRate ?? '-'}%</td></tr>
      <tr><td>Attributed revenue / commission (USDT)</td><td>{report.revenueUsdt} / {report.commissionUsdt}</td></tr>
      <tr><td>Codes activated / used</td><td>{report.codes.activated} / {report.codes.used}</td></tr>
      <tr><td>On-time touches / red calls</td><td>{report.schedule.onTimeRate ?? '-'}% / {report.schedule.redCalls}</td></tr>
      <tr><td>Top reasons</td><td>{report.topReasons.map(({ title, count }) => `${title} (${count})`).join(', ') || '-'}</td></tr>
      {report.workingDays !== null && <tr><td>Working days (frozen days excluded)</td><td>{report.workingDays} ({report.frozenDays} frozen)</td></tr>}
    </tbody>
  </table>
);

const Reports = () => {
  const [period, setPeriod] = useState<ReportPeriod>('MONTHLY');
  const [mine, setMine] = useState<MyReport | null>(null);
  const [team, setTeam] = useState<TeamReport | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const own = await post<MyReport | RouteError>(MY_REPORT_ROUTE_PATH, { period });
    const everyone = await post<TeamReport | RouteError>(TEAM_REPORT_ROUTE_PATH, { period });

    setMine(own.success ? own : null);
    setTeam(everyone.success ? everyone : null);
    setMessage(own.success ? null : (own.error ?? 'Could not load the report'));
  }, [period]);

  useEffect(() => {
    load().catch(() => setMessage('Could not load the report'));
  }, [load]);

  const markPaid = async (incomeId: string) => {
    const result = await post<{ success: boolean; error?: string }>(MARK_INCOME_PAID_ROUTE_PATH, { incomeId });

    setMessage(result.success ? null : (result.error ?? 'Failed'));
    await load();
  };

  return (
    <div style={{ padding: 16 }}>
      {message && <p role="alert">{message}</p>}
      {REPORT_PERIODS.map((value) => (
        <button key={value} type="button" disabled={value === period} onClick={() => setPeriod(value)}>
          {value.toLowerCase()}
        </button>
      ))}
      {mine && (
        <>
          <h3>My report</h3>
          <ReportTable report={mine.report} />
          <h4>Monthly income</h4>
          <ul>
            {mine.incomes.map((income) => (
              <li key={`${income.jalaliYear}-${income.jalaliMonth}`}>
                {income.jalaliYear}/{income.jalaliMonth}: {income.totalUsdt} USDT, {income.status?.toLowerCase()}
              </li>
            ))}
          </ul>
        </>
      )}
      {team && (
        <>
          <h3>Team</h3>
          <ReportTable report={team.totals} />
          {team.longFreezes.length > 0 && <p>Long freezes: {team.longFreezes.map(({ name }) => name).join(', ')}</p>}
          {team.admins.map((admin) => (
            <details key={admin.memberId}>
              <summary>{admin.rank}. {admin.name}</summary>
              <ReportTable report={admin.report} />
            </details>
          ))}
          {team.pendingIncomes.map((income) => (
            <p key={`${income.adminId}-${income.jalaliYear}-${income.jalaliMonth}`}>
              {income.adminName} {income.jalaliYear}/{income.jalaliMonth}: {income.totalUsdt} USDT pending
              <button type="button" onClick={() => markPaid(income.id)}>Mark paid</button>
            </p>
          ))}
        </>
      )}
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: REPORTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'reports',
  description: 'My report for every Admin; team report and Mark paid for Supervisors and the Full Admin.',
  component: Reports,
});
