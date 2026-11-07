import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { msg, Trans, useTranslate } from 'twenty-sdk/front-component';

import { Callout } from 'twenty-ui/components/feedback';
import { Tag } from 'twenty-ui/primitives/data-display';
import { Button } from 'twenty-ui/primitives/input';
import { Collapsible } from 'twenty-ui/primitives/layout';
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
import { EmptyState, ErrorCallout, LoadingState } from 'src/front-components/components/state-views';
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
import { isNotAllowedError } from 'src/utils/is-not-allowed-error.util';
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
  const rows: { label: ReactNode; value: ReactNode }[] = [
    {
      label: <Trans>Follow-up calls (answered / total)</Trans>,
      value: <NumericValue>{`${report.calls.followup.answered} / ${report.calls.followup.total} (${dash(report.calls.followup.answerRate)}%)`}</NumericValue>,
    },
    {
      label: <Trans>Retention calls (answered / total)</Trans>,
      value: <NumericValue>{`${report.calls.retention.answered} / ${report.calls.retention.total} (${dash(report.calls.retention.answerRate)}%)`}</NumericValue>,
    },
    { label: <Trans>Cases added</Trans>, value: <NumericValue>{report.cases.added}</NumericValue> },
    {
      label: <Trans>Outcomes</Trans>,
      value: joinCounts(
        Object.entries(report.cases.outcomes).map(([status, count]) => [translateValue(CASE_STATUS_LABELS, status, t), count]),
      ),
    },
    { label: <Trans>Failed by reason</Trans>, value: joinCounts(Object.entries(report.cases.failedByReason)) },
    { label: <Trans>Conversion rate</Trans>, value: <NumericValue>{`${dash(report.conversionRate)}%`}</NumericValue> },
    {
      label: <Trans>Attributed revenue / commission (USDT)</Trans>,
      value: <NumericValue>{`${report.revenueUsdt} / ${report.commissionUsdt}`}</NumericValue>,
    },
    { label: <Trans>Codes activated / used</Trans>, value: <NumericValue>{`${report.codes.activated} / ${report.codes.used}`}</NumericValue> },
    {
      label: <Trans>On-time touches / red calls</Trans>,
      value: <NumericValue>{`${dash(report.schedule.onTimeRate)}% / ${report.schedule.redCalls}`}</NumericValue>,
    },
    { label: <Trans>Top reasons</Trans>, value: joinCounts(report.topReasons.map(({ title, count }) => [title, count])) },
  ];

  if (report.workingDays !== null) {
    rows.push({
      label: <Trans>Working days (frozen days excluded)</Trans>,
      value: t('{workingDays} ({frozenDays} frozen)', { workingDays: report.workingDays, frozenDays: report.frozenDays ?? 0 }),
    });
  }

  return (
    <TableWrapper>
      <Table>
        <tbody>
          {rows.map(({ label, value }, index) => (
            <tr key={index}>
              <Cell>{label}</Cell>
              <Cell>
                <strong>{value}</strong>
              </Cell>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableWrapper>
  );
};

const Reports = () => {
  const { t } = useTranslate();
  const [period, setPeriod] = useState<ReportPeriod>('MONTHLY');
  const [mine, setMine] = useState<MyReport | null>(null);
  const [team, setTeam] = useState<TeamReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; isNotAllowed: boolean } | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const own = await postRoute<MyReport | RouteError>(MY_REPORT_ROUTE_PATH, { period });
    const everyone = await postRoute<TeamReport | RouteError>(TEAM_REPORT_ROUTE_PATH, { period });

    setMine(own.success ? own : null);
    setTeam(everyone.success ? everyone : null);
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

  return (
    <Page>
      <Tabs.Root value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
        <Tabs.List>
          {REPORT_PERIODS.map((value) => (
            <Tabs.Tab key={value} value={value}>
              {translateValue(PERIOD_LABELS, value, t)}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
      {error && (
        <ErrorCallout
          title={error.message}
          hint={error.isNotAllowed ? t('Your role does not allow this page. Ask a Full Admin to check your role.') : undefined}
        />
      )}
      {isLoading && <LoadingState />}
      {mine && (
        <Stack>
          <SectionTitle>
            <Trans>My report</Trans>
          </SectionTitle>
          <ReportTable report={mine.report} />
          <SectionTitle>
            <Trans context="report-section">Monthly income</Trans>
          </SectionTitle>
          {mine.incomes.length === 0 ? (
            <EmptyState>{t('No monthly income yet.')}</EmptyState>
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
                  {mine.incomes.map((income) => (
                    <tr key={`${income.jalaliYear}-${income.jalaliMonth}`}>
                      <Cell>
                        <NumericValue>
                          {income.jalaliYear}/{income.jalaliMonth}
                        </NumericValue>
                      </Cell>
                      <Cell>{income.totalUsdt ?? ''}</Cell>
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
          )}
        </Stack>
      )}
      {team && (
        <Stack>
          <SectionTitle>
            <Trans>Team</Trans>
          </SectionTitle>
          <ReportTable report={team.totals} />
          {team.longFreezes.length > 0 && (
            <Callout status="warning" title={t('Long freezes: {names}', { names: team.longFreezes.map(({ name }) => name).join(', ') })} fullWidth />
          )}
          <SectionTitle>{t('Ranking')}</SectionTitle>
          {team.admins.map((admin) => (
            <Collapsible.Root key={admin.memberId}>
              <Collapsible.Trigger render={<Button variant="ghost" fullWidth />}>
                <Row>
                  <Tag color="gray">{admin.rank}</Tag>
                  {admin.name}
                </Row>
              </Collapsible.Trigger>
              <Collapsible.Panel>
                <ReportTable report={admin.report} />
              </Collapsible.Panel>
            </Collapsible.Root>
          ))}
          {team.pendingIncomes.length > 0 && (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <HeaderCell>
                      <Trans>Admin</Trans>
                    </HeaderCell>
                    <HeaderCell>{t('Month')}</HeaderCell>
                    <HeaderCell>{t('Total (USDT)')}</HeaderCell>
                    <HeaderCell />
                  </tr>
                </thead>
                <tbody>
                  {team.pendingIncomes.map((income) => (
                    <tr key={`${income.adminId}-${income.jalaliYear}-${income.jalaliMonth}`}>
                      <Cell>{income.adminName ?? ''}</Cell>
                      <Cell>
                        <NumericValue>
                          {income.jalaliYear}/{income.jalaliMonth}
                        </NumericValue>
                      </Cell>
                      <Cell>{income.totalUsdt ?? ''}</Cell>
                      <Cell>
                        <Button size="sm" color="accent" loading={markingId === income.id} onClick={() => markPaid(income.id)}>
                          <Trans>Mark paid</Trans>
                        </Button>
                      </Cell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>
          )}
        </Stack>
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
