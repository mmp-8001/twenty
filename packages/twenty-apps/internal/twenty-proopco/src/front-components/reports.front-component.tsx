import { useCallback, useEffect, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { msg, Trans, useTranslate } from 'twenty-sdk/front-component';

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
import { serverErrorLabel, translateValue } from 'src/utils/front-labels.util';
import { postRoute } from 'src/utils/post-route.util';

type RouteError = { success: false; error?: string };
type MyReport = Awaited<ReturnType<typeof readMyReport>>;
type TeamReport = Awaited<ReturnType<typeof readTeamReport>>;

const SERVER_ERRORS = [
  msg('Sign in required'),
  msg('Your account is frozen or deactivated'),
  msg('You are not allowed to do this'),
  msg('This income is not available'),
];

const PERIOD_LABELS = {
  DAILY: msg({ message: 'Daily', context: 'report-period' }),
  WEEKLY: msg({ message: 'Weekly', context: 'report-period' }),
  MONTHLY: msg({ message: 'Monthly', context: 'report-period' }),
  ALL: msg({ message: 'All time', context: 'report-period' }),
};

const INCOME_STATUS_LABELS = {
  PENDING: msg({ message: 'Pending', context: 'income-status' }),
  PAID: msg({ message: 'Paid', context: 'income-status' }),
};

const CASE_STATUS_LABELS = {
  PENDING_FIRST_CALL: msg({ message: 'Pending first call', context: 'case-status' }),
  IN_PROGRESS: msg({ message: 'In progress', context: 'case-status' }),
  REBUY_PENDING: msg({ message: 'Rebuy pending', context: 'case-status' }),
  SUCCESSFUL: msg({ message: 'Successful', context: 'case-status' }),
  EXPIRED: msg({ message: 'Expired', context: 'case-status' }),
  FAILED: msg({ message: 'Failed', context: 'case-status' }),
  NO_ANSWER_FIRST_CALL: msg({ message: 'No answer on first call', context: 'case-status' }),
  PURCHASE_BEFORE_CALL: msg({ message: 'Purchase before call', context: 'case-status' }),
  RELEASED_72H: msg({ message: 'Released after 72 hours', context: 'case-status' }),
  TRANSFERRED: msg({ message: 'Transferred', context: 'case-status' }),
  RELEASED_BY_MANAGER: msg({ message: 'Released by manager', context: 'case-status' }),
};

const ReportTable = ({ report }: { report: Report }) => {
  const { t } = useTranslate();
  const dash = (value: number | null) => value ?? '-';
  const joinCounts = (entries: [string, number][]) =>
    entries.map(([label, count]) => `${label}: ${count}`).join(', ') || '-';

  return (
    <table>
      <tbody>
        <tr>
          <td>
            <Trans>Follow-up calls (answered / total)</Trans>
          </td>
          <td>
            {report.calls.followup.answered} / {report.calls.followup.total} ({dash(report.calls.followup.answerRate)}%)
          </td>
        </tr>
        <tr>
          <td>
            <Trans>Retention calls (answered / total)</Trans>
          </td>
          <td>
            {report.calls.retention.answered} / {report.calls.retention.total} ({dash(report.calls.retention.answerRate)}%)
          </td>
        </tr>
        <tr>
          <td>
            <Trans>Cases added</Trans>
          </td>
          <td>{report.cases.added}</td>
        </tr>
        <tr>
          <td>
            <Trans>Outcomes</Trans>
          </td>
          <td>
            {joinCounts(Object.entries(report.cases.outcomes).map(([status, count]) => [translateValue(CASE_STATUS_LABELS, status, t), count]))}
          </td>
        </tr>
        <tr>
          <td>
            <Trans>Failed by reason</Trans>
          </td>
          <td>{joinCounts(Object.entries(report.cases.failedByReason))}</td>
        </tr>
        <tr>
          <td>
            <Trans>Conversion rate</Trans>
          </td>
          <td>{dash(report.conversionRate)}%</td>
        </tr>
        <tr>
          <td>
            <Trans>Attributed revenue / commission (USDT)</Trans>
          </td>
          <td>
            {report.revenueUsdt} / {report.commissionUsdt}
          </td>
        </tr>
        <tr>
          <td>
            <Trans>Codes activated / used</Trans>
          </td>
          <td>
            {report.codes.activated} / {report.codes.used}
          </td>
        </tr>
        <tr>
          <td>
            <Trans>On-time touches / red calls</Trans>
          </td>
          <td>
            {dash(report.schedule.onTimeRate)}% / {report.schedule.redCalls}
          </td>
        </tr>
        <tr>
          <td>
            <Trans>Top reasons</Trans>
          </td>
          <td>{joinCounts(report.topReasons.map(({ title, count }) => [title, count]))}</td>
        </tr>
        {report.workingDays !== null && (
          <tr>
            <td>
              <Trans>Working days (frozen days excluded)</Trans>
            </td>
            <td>{t('{workingDays} ({frozenDays} frozen)', { workingDays: report.workingDays, frozenDays: report.frozenDays ?? 0 })}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

const Reports = () => {
  const { t } = useTranslate();
  const [period, setPeriod] = useState<ReportPeriod>('MONTHLY');
  const [mine, setMine] = useState<MyReport | null>(null);
  const [team, setTeam] = useState<TeamReport | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const own = await postRoute<MyReport | RouteError>(MY_REPORT_ROUTE_PATH, { period });
    const everyone = await postRoute<TeamReport | RouteError>(TEAM_REPORT_ROUTE_PATH, { period });

    setMine(own.success ? own : null);
    setTeam(everyone.success ? everyone : null);
    setMessage(own.success ? null : serverErrorLabel(own.error, t('Could not load the report'), SERVER_ERRORS, t));
  }, [period, t]);

  useEffect(() => {
    load().catch(() => setMessage(t('Could not load the report')));
  }, [load]);

  const markPaid = async (incomeId: string) => {
    const result = await postRoute<{ success: boolean; error?: string }>(MARK_INCOME_PAID_ROUTE_PATH, { incomeId });

    setMessage(result.success ? null : serverErrorLabel(result.error, t('Failed'), SERVER_ERRORS, t));
    await load();
  };

  return (
    <div style={{ padding: 16 }}>
      {message && <p role="alert">{message}</p>}
      {REPORT_PERIODS.map((value) => (
        <button key={value} type="button" disabled={value === period} onClick={() => setPeriod(value)}>
          {translateValue(PERIOD_LABELS, value, t)}
        </button>
      ))}
      {mine && (
        <>
          <h3>
            <Trans>My report</Trans>
          </h3>
          <ReportTable report={mine.report} />
          <h4>
            <Trans context="report-section">Monthly income</Trans>
          </h4>
          <ul>
            {mine.incomes.map((income) => (
              <li key={`${income.jalaliYear}-${income.jalaliMonth}`}>
                {t('{year}/{month}: {total} USDT, {status}', {
                  year: income.jalaliYear ?? '',
                  month: income.jalaliMonth ?? '',
                  total: income.totalUsdt ?? '',
                  status: translateValue(INCOME_STATUS_LABELS, income.status, t),
                })}
              </li>
            ))}
          </ul>
        </>
      )}
      {team && (
        <>
          <h3>
            <Trans>Team</Trans>
          </h3>
          <ReportTable report={team.totals} />
          {team.longFreezes.length > 0 && <p>{t('Long freezes: {names}', { names: team.longFreezes.map(({ name }) => name).join(', ') })}</p>}
          {team.admins.map((admin) => (
            <details key={admin.memberId}>
              <summary>{admin.rank}. {admin.name}</summary>
              <ReportTable report={admin.report} />
            </details>
          ))}
          {team.pendingIncomes.map((income) => (
            <p key={`${income.adminId}-${income.jalaliYear}-${income.jalaliMonth}`}>
              {t('{adminName} {year}/{month}: {total} USDT pending', {
                adminName: income.adminName ?? '',
                year: income.jalaliYear ?? '',
                month: income.jalaliMonth ?? '',
                total: income.totalUsdt ?? '',
              })}
              <button type="button" onClick={() => markPaid(income.id)}>
                <Trans>Mark paid</Trans>
              </button>
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
