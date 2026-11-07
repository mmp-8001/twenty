import styled from '@emotion/styled';
import { useCallback, useEffect, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { msg, Trans, useLocale, useTranslate } from 'twenty-sdk/front-component';

import { Callout } from 'twenty-ui/components/feedback';
import { Tag } from 'twenty-ui/primitives/data-display';
import { Button } from 'twenty-ui/primitives/input';
import { IconCoins, IconUsers } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';
import { Tabs } from 'twenty-ui/primitives/navigation';

import {
  Cell,
  HeaderCell,
  NumericValue,
  Page,
  Row,
  SectionTitle,
  Stack,
  Table,
  TableWrapper,
} from 'src/front-components/components/layout';
import {
  BreakdownCard,
  BreakdownGrid,
  KpiCard,
  KpiGrid,
} from 'src/front-components/components/report-widgets';
import { EmptyState, ErrorCallout, LoadingState } from 'src/front-components/components/state-views';
import {
  MARK_INCOME_PAID_ROUTE_PATH,
  MY_REPORT_ROUTE_PATH,
  REPORT_PERIODS,
  type ReportPeriod,
  TEAM_REPORT_ROUTE_PATH,
} from 'src/constants/income-report.constant';
import { ADMINS_ROUTE_PATH } from 'src/constants/admin-management.constant';
import { REPORTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { type readMyReport } from 'src/logic-functions/utils/read-my-report.util';
import { type readTeamReport } from 'src/logic-functions/utils/read-team-report.util';
import { type Report } from 'src/utils/build-report.util';
import { serverErrorLabel, translateValue } from 'src/utils/front-labels.util';
import {
  type BreakdownEntry,
  formatJalaliMonth,
  formatNumber,
  formatPercent,
  formatUsdt,
  outcomeTone,
  rankAdmins,
  sortBreakdown,
} from 'src/utils/report-view.util';
import { isNotAllowedError } from 'src/utils/is-not-allowed-error.util';
import { postRoute } from 'src/utils/post-route.util';

type RouteError = { success: false; error?: string };
type MyReport = Awaited<ReturnType<typeof readMyReport>>;
type TeamReport = Awaited<ReturnType<typeof readTeamReport>>;
type ReportView = 'mine' | 'team';
type Translate = ReturnType<typeof useTranslate>['t'];

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

const UNKNOWN_REASON = 'Unknown';

const TopRow = styled.tr`
  background: ${() => themeCssVariables.background.transparent.success};
`;

const Toolbar = styled(Row)`
  justify-content: space-between;
`;

const ReportBody = ({ report, locale }: { report: Report; locale: string }) => {
  const { t } = useTranslate();
  const noData = t('No data');
  const percentOrNoData = (rate: number | null) => formatPercent(locale, rate) ?? noData;
  const count = (value: number) => formatNumber(locale, value);
  const pair = (left: number, right: number) => `${count(left)} / ${count(right)}`;
  const reasonEntries = (entries: { title: string; count: number }[]): BreakdownEntry[] =>
    sortBreakdown(
      entries.map(({ title, count: total }) => ({
        key: title,
        label: title === UNKNOWN_REASON ? t('Unknown') : title,
        count: total,
      })),
    );
  const { followup, retention } = report.calls;

  return (
    <Stack>
      <KpiGrid>
        <KpiCard
          label={t('Follow-up calls (answered / total)')}
          value={pair(followup.answered, followup.total)}
          bar={{ percent: followup.answerRate ?? 0 }}
          caption={t('Answer rate: {rate}', { rate: percentOrNoData(followup.answerRate) })}
        />
        <KpiCard
          label={t('Retention calls (answered / total)')}
          value={pair(retention.answered, retention.total)}
          bar={{ percent: retention.answerRate ?? 0 }}
          caption={t('Answer rate: {rate}', { rate: percentOrNoData(retention.answerRate) })}
        />
        <KpiCard label={t('Cases added')} value={count(report.cases.added)} />
        <KpiCard
          label={t('Conversion rate')}
          value={percentOrNoData(report.conversionRate)}
          bar={{ percent: report.conversionRate ?? 0, tone: 'success' }}
        />
        <KpiCard label={t('Attributed revenue (USDT)')} value={formatUsdt(locale, report.revenueUsdt)} />
        <KpiCard label={t('Commission (USDT)')} value={formatUsdt(locale, report.commissionUsdt)} />
        <KpiCard label={t('Codes activated / used')} value={pair(report.codes.activated, report.codes.used)} />
        <KpiCard
          label={t('On-time touches')}
          value={percentOrNoData(report.schedule.onTimeRate)}
          bar={{ percent: report.schedule.onTimeRate ?? 0 }}
          caption={t('{count} red calls', { count: count(report.schedule.redCalls) })}
        />
        {report.workingDays !== null && (
          <KpiCard
            label={t('Working days')}
            value={count(report.workingDays)}
            caption={t('{count} frozen days', { count: count(report.frozenDays ?? 0) })}
          />
        )}
      </KpiGrid>
      <BreakdownGrid>
        <BreakdownCard
          title={t('Outcomes')}
          entries={sortBreakdown(
            Object.entries(report.cases.outcomes).map(([status, total]) => ({
              key: status,
              label: translateValue(CASE_STATUS_LABELS, status, t),
              count: total,
            })),
          )}
          toneOf={({ key }) => outcomeTone(key)}
          formatCount={count}
          emptyText={t('Nothing to show for this period.')}
        />
        <BreakdownCard
          title={t('Failed by reason')}
          entries={reasonEntries(Object.entries(report.cases.failedByReason).map(([title, total]) => ({ title, count: total })))}
          toneOf={() => 'failure'}
          formatCount={count}
          emptyText={t('Nothing to show for this period.')}
        />
        <BreakdownCard
          title={t('Top reasons')}
          entries={reasonEntries(report.topReasons)}
          formatCount={count}
          emptyText={t('Nothing to show for this period.')}
        />
      </BreakdownGrid>
    </Stack>
  );
};

const IncomeTable = ({
  incomes,
  locale,
  t,
}: {
  incomes: MyReport['incomes'];
  locale: string;
  t: Translate;
}) =>
  incomes.length === 0 ? (
    <EmptyState icon={IconCoins}>{t('No monthly income yet.')}</EmptyState>
  ) : (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <HeaderCell>{t('Month')}</HeaderCell>
            <HeaderCell>{t('Total (USDT)')}</HeaderCell>
            <HeaderCell>
              <Trans>Status</Trans>
            </HeaderCell>
          </tr>
        </thead>
        <tbody>
          {incomes.map((income) => (
            <tr key={`${income.jalaliYear}-${income.jalaliMonth}`}>
              <Cell>{formatJalaliMonth(locale, income.jalaliYear ?? 0, income.jalaliMonth ?? 1)}</Cell>
              <Cell>
                <NumericValue>{formatUsdt(locale, income.totalUsdt)}</NumericValue>
              </Cell>
              <Cell>
                <Tag color={income.status === 'PAID' ? 'green' : 'yellow'}>
                  {translateValue(INCOME_STATUS_LABELS, income.status, t)}
                </Tag>
              </Cell>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableWrapper>
  );

const RankingTable = ({ admins, locale, t }: { admins: TeamReport['admins']; locale: string; t: Translate }) =>
  admins.length === 0 ? (
    <EmptyState icon={IconUsers}>{t('No admins yet.')}</EmptyState>
  ) : (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <HeaderCell>#</HeaderCell>
            <HeaderCell>
              <Trans>Admin</Trans>
            </HeaderCell>
            <HeaderCell>{t('Conversion rate')}</HeaderCell>
            <HeaderCell>{t('Revenue (USDT)')}</HeaderCell>
            <HeaderCell>{t('Successful cases')}</HeaderCell>
            <HeaderCell>{t('Calls')}</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {rankAdmins(admins).map(({ memberId, name, report }, index) => {
            const BodyRow = index === 0 ? TopRow : 'tr';

            return (
              <BodyRow key={memberId}>
                <Cell>
                  <Tag color={index === 0 ? 'green' : 'gray'}>{formatNumber(locale, index + 1)}</Tag>
                </Cell>
                <Cell>{name}</Cell>
                <Cell>
                  <NumericValue>{formatPercent(locale, report.conversionRate) ?? t('No data')}</NumericValue>
                </Cell>
                <Cell>
                  <NumericValue>{formatUsdt(locale, report.revenueUsdt)}</NumericValue>
                </Cell>
                <Cell>
                  <NumericValue>{formatNumber(locale, report.cases.outcomes.SUCCESSFUL ?? 0)}</NumericValue>
                </Cell>
                <Cell>
                  <NumericValue>{formatNumber(locale, report.calls.followup.total + report.calls.retention.total)}</NumericValue>
                </Cell>
              </BodyRow>
            );
          })}
        </tbody>
      </Table>
    </TableWrapper>
  );

const Reports = () => {
  const { t } = useTranslate();
  const locale = useLocale();
  const [period, setPeriod] = useState<ReportPeriod>('MONTHLY');
  const [view, setView] = useState<ReportView | null>(null);
  const [callerRole, setCallerRole] = useState<string | null>(null);
  const [mine, setMine] = useState<MyReport | null>(null);
  const [team, setTeam] = useState<TeamReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; isNotAllowed: boolean } | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const own = await postRoute<MyReport | RouteError>(MY_REPORT_ROUTE_PATH, { period });
    const everyone = await postRoute<TeamReport | RouteError>(TEAM_REPORT_ROUTE_PATH, { period });
    // Only Supervisors and the Full Admin reach the team route, so this call is limited to them too.
    const caller = everyone.success ? await postRoute<{ callerRole?: string }>(ADMINS_ROUTE_PATH, {}) : null;

    setMine(own.success ? own : null);
    setTeam(everyone.success ? everyone : null);
    setCallerRole(caller?.callerRole ?? null);
    setError(
      own.success
        ? null
        : {
            message: serverErrorLabel(own.error, t('Could not load the report'), SERVER_ERRORS, t),
            isNotAllowed: isNotAllowedError(own.error),
          },
    );
    setIsLoading(false);
  }, [period, t]);

  useEffect(() => {
    load().catch(() => {
      setError({ message: t('Could not load the report'), isNotAllowed: false });
      setIsLoading(false);
    });
  }, [load]);

  const markPaid = async (incomeId: string) => {
    setMarkingId(incomeId);

    try {
      const result = await postRoute<{ success: boolean; error?: string }>(MARK_INCOME_PAID_ROUTE_PATH, { incomeId });

      setError(
        result.success
          ? null
          : { message: serverErrorLabel(result.error, t('Failed'), SERVER_ERRORS, t), isNotAllowed: isNotAllowedError(result.error) },
      );
      await load();
    } finally {
      setMarkingId(null);
    }
  };

  const isFullAdmin = callerRole === 'FULL_ADMIN';
  const canSwitch = mine !== null && team !== null && !isFullAdmin;
  const activeView: ReportView = team && (isFullAdmin || !mine || view === 'team') ? 'team' : 'mine';

  return (
    <Page>
      <Toolbar>
        <Tabs.Root value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
          <Tabs.List>
            {REPORT_PERIODS.map((value) => (
              <Tabs.Tab key={value} value={value}>
                {translateValue(PERIOD_LABELS, value, t)}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.Root>
        {canSwitch && (
          <Tabs.Root value={activeView} onValueChange={(value) => setView(value as ReportView)}>
            <Tabs.List>
              <Tabs.Tab value="mine">
                <Trans>My report</Trans>
              </Tabs.Tab>
              <Tabs.Tab value="team">
                <Trans>Team</Trans>
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>
        )}
      </Toolbar>
      {error && (
        <ErrorCallout
          title={error.message}
          hint={error.isNotAllowed ? t('Your role does not allow this page. Ask a Full Admin to check your role.') : undefined}
        />
      )}
      {isLoading && <LoadingState />}
      {activeView === 'mine' && mine && (
        <>
          <ReportBody report={mine.report} locale={locale} />
          <Stack>
            <SectionTitle>
              <Trans context="report-section">Monthly income</Trans>
            </SectionTitle>
            <IncomeTable incomes={mine.incomes} locale={locale} t={t} />
          </Stack>
        </>
      )}
      {activeView === 'team' && team && (
        <>
          {team.longFreezes.length > 0 && (
            <Callout status="warning" title={t('Long freezes: {names}', { names: team.longFreezes.map(({ name }) => name).join(', ') })} fullWidth />
          )}
          <ReportBody report={team.totals} locale={locale} />
          <Stack>
            <SectionTitle>{t('Ranking')}</SectionTitle>
            <RankingTable admins={team.admins} locale={locale} t={t} />
          </Stack>
          <Stack>
            <SectionTitle>{t('Pending monthly income')}</SectionTitle>
            {team.pendingIncomes.length === 0 ? (
              <EmptyState icon={IconCoins}>{t('No pending monthly income.')}</EmptyState>
            ) : (
              <TableWrapper>
                <Table>
                  <thead>
                    <tr>
                      <HeaderCell>
                        <Trans>Admin</Trans>
                      </HeaderCell>
                      <HeaderCell>{t('Month')}</HeaderCell>
                      <HeaderCell>{t('Total (USDT)')}</HeaderCell>
                      <HeaderCell>
                        <Trans>Status</Trans>
                      </HeaderCell>
                      {isFullAdmin && <HeaderCell />}
                    </tr>
                  </thead>
                  <tbody>
                    {team.pendingIncomes.map((income) => (
                      <tr key={`${income.adminId}-${income.jalaliYear}-${income.jalaliMonth}`}>
                        <Cell>{income.adminName ?? ''}</Cell>
                        <Cell>{formatJalaliMonth(locale, income.jalaliYear ?? 0, income.jalaliMonth ?? 1)}</Cell>
                        <Cell>
                          <NumericValue>{formatUsdt(locale, income.totalUsdt)}</NumericValue>
                        </Cell>
                        <Cell>
                          <Tag color="yellow">{translateValue(INCOME_STATUS_LABELS, 'PENDING', t)}</Tag>
                        </Cell>
                        {isFullAdmin && (
                          <Cell>
                            <Button size="sm" color="accent" loading={markingId === income.id} onClick={() => markPaid(income.id)}>
                              <Trans>Mark paid</Trans>
                            </Button>
                          </Cell>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrapper>
            )}
          </Stack>
        </>
      )}
    </Page>
  );
};

export default defineFrontComponent({
  universalIdentifier: REPORTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'reports',
  description: 'My report for every Admin; team report and Mark paid for Supervisors and the Full Admin.',
  component: Reports,
});
