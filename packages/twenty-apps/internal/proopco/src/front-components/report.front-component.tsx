import 'twenty-ui/style.css';
import 'twenty-ui/theme-dark.css';
import 'twenty-ui/theme-light.css';

import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent, PageLayoutType } from 'twenty-sdk/define';
import { AppPath, msg, openSidePanelPage, useColorScheme, useTranslate } from 'twenty-sdk/front-component';
import { Tag } from 'twenty-ui/primitives/data-display';
import { Skeleton } from 'twenty-ui/primitives/feedback';
import { Button, ButtonGroup, Select } from 'twenty-ui/primitives/input';
import { THEME_DARK, THEME_LIGHT, ThemeProvider, type ThemeColor } from 'twenty-ui/theme';

import { type RefusalCode } from 'src/constants/refusal-codes.constant';
import { REPORT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { serverErrorMessage } from 'src/front-components/utils/server-error.util';
import { jalaliMonthStart } from 'src/utils/jalali.util';
import { type ReportPeriodKind } from 'src/utils/report.util';

type Summary = {
  calls: { total: number; answered: number; unanswered: number; answerRate: number | null; followUp: number; retention: number; reds: number; perWorkingDay: number | null };
  deals: { added: number; won: number; lost: number; byCloseReason: Record<string, number> };
  conversion: number | null;
  revenue: number;
  codes: { activated: number; used: number };
  adherence: { done: number; missed: number; rate: number | null };
  commission: number;
  income: { totalUsdt: number; status: string } | null;
  workingDays: number | null;
};
type AgentStatus = { kind: 'ACTIVE' } | { kind: 'INACTIVE' } | { kind: 'FROZEN'; days: number };
type Row = Summary & { agentId: string; name: string; rank: number | null; status: AgentStatus };
type ReportResponse = {
  period: { kind: ReportPeriodKind; offset: number; start: string; end: string };
  rows: Row[];
  overall: Summary | null;
  campaigns: { label: string | null; kind: 'CAMPAIGN' | 'REBUY' | 'RETENTION'; calls: number; revenue: number }[];
  topReasons: { name: string; count: number }[];
  agents: { id: string; name: string }[];
  failedEvents: number | null;
  longFreezes: { agentId: string; name: string; days: number; waitingContacts: number }[];
  incomeHistory: { jalaliMonth: string; totalUsdt: number; status: string; paidAt: string | null }[];
};
type Label = ReturnType<typeof msg>;
type Translate = (descriptor: Label, values?: Record<string, string | number>) => string;

const PERIODS: { kind: ReportPeriodKind; label: Label }[] = [
  { kind: 'DAY', label: msg('Day') },
  { kind: 'WEEK', label: msg('Week') },
  { kind: 'MONTH', label: msg('Month') },
  { kind: 'ALL', label: msg('All time') },
];

const ERROR_MESSAGES: Partial<Record<RefusalCode, Label>> = {
  NO_ACCESS: msg('You have no access to reports.'),
  NO_AGENT: msg('You have no agent record.'),
};

const CLOSE_REASON_LABELS: Record<string, Label> = {
  EXPIRED: msg('Expired'),
  UNANSWERED_AT_FIRST_CALL: msg('Unanswered at first call'),
  ABANDONED_IN_72H: msg('Abandoned in 72 hours'),
  DO_NOT_CONTACT: msg('Do not contact'),
  TRANSFERRED: msg('Transferred'),
  RELEASED: msg('Released'),
  PURCHASED_BEFORE_CALL: msg('Bought before the call'),
};

type RankingColumn = { key: string; label: Label; value: (row: Row) => number | null; format: 'number' | 'percent' | 'usdt' };

const RANKING_COLUMNS: RankingColumn[] = [
  { key: 'calls', label: msg('Calls'), value: (row) => row.calls.total, format: 'number' },
  { key: 'answerRate', label: msg('Answer rate'), value: (row) => row.calls.answerRate, format: 'percent' },
  { key: 'closed', label: msg('Closed'), value: (row) => row.deals.won + row.deals.lost, format: 'number' },
  { key: 'won', label: msg('Successful'), value: (row) => row.deals.won, format: 'number' },
  { key: 'conversion', label: msg('Conversion'), value: (row) => row.conversion, format: 'percent' },
  { key: 'revenue', label: msg('Revenue (USDT)'), value: (row) => row.revenue, format: 'number' },
  { key: 'adherence', label: msg('Plan adherence'), value: (row) => row.adherence.rate, format: 'percent' },
];

const intlLocale = (locale: string, calendar = false) => `${locale === 'fa-IR' ? 'fa-IR' : 'en'}${calendar ? '-u-ca-persian' : ''}`;
const formatAt = (date: Date, locale: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(intlLocale(locale, true), { timeZone: 'Asia/Tehran', ...options }).format(date);

const openAgent = (agentId: string) =>
  openSidePanelPage({ to: AppPath.RecordShowPage, params: { objectNameSingular: 'agent', objectRecordId: agentId } });

const styles: Record<string, CSSProperties> = {
  container: {
    fontFamily: 'var(--t-font-family)',
    fontSize: 'var(--t-font-size-sm)',
    color: 'var(--t-font-color-primary)',
    background: 'var(--t-background-primary)',
    padding: 'var(--t-spacing-6)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--t-spacing-4)',
    boxSizing: 'border-box',
    height: '100%',
    overflowY: 'auto',
  },
  header: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--t-spacing-3)' },
  title: { margin: 0, fontSize: 'var(--t-font-size-xl)', fontWeight: 'var(--t-font-weight-semi-bold)' },
  toolbar: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--t-spacing-2)' },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--t-spacing-4)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--t-spacing-4)', alignItems: 'start' },
  card: {
    border: '1px solid var(--t-border-color-medium)',
    borderRadius: 'var(--t-border-radius-md)',
    padding: 'var(--t-spacing-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--t-spacing-2)',
    minWidth: 0,
  },
  cardTitle: { margin: 0, fontSize: 'var(--t-font-size-md)', fontWeight: 'var(--t-font-weight-semi-bold)' },
  kpiValue: { fontSize: 'var(--t-font-size-xxl)', fontWeight: 'var(--t-font-weight-semi-bold)' },
  hint: { color: 'var(--t-font-color-tertiary)', fontSize: 'var(--t-font-size-xs)' },
  line: { display: 'flex', justifyContent: 'space-between', gap: 'var(--t-spacing-3)', padding: 'var(--t-spacing-2) 0', borderTop: '1px solid var(--t-border-color-light)' },
  strong: { fontWeight: 'var(--t-font-weight-semi-bold)' },
  banner: {
    border: '1px solid var(--t-color-yellow8)',
    background: 'var(--t-color-yellow3)',
    borderRadius: 'var(--t-border-radius-md)',
    padding: 'var(--t-spacing-3) var(--t-spacing-4)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--t-spacing-3)',
  },
  bar: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 120px 32px', alignItems: 'center', gap: 'var(--t-spacing-3)', padding: 'var(--t-spacing-1) 0' },
  track: { height: 8, borderRadius: 4, background: 'var(--t-background-tertiary)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, background: 'var(--t-color-blue)' },
  tableWrap: { overflowX: 'auto' },
  table: { borderCollapse: 'collapse', width: '100%' },
  cell: { padding: 'var(--t-spacing-3) var(--t-spacing-2)', textAlign: 'start', borderTop: '1px solid var(--t-border-color-light)', whiteSpace: 'nowrap' },
  headCell: { padding: 'var(--t-spacing-2)', textAlign: 'start', color: 'var(--t-font-color-tertiary)', fontWeight: 'var(--t-font-weight-medium)', whiteSpace: 'nowrap' },
  sortable: { cursor: 'pointer', userSelect: 'none' },
  sorted: { color: 'var(--t-font-color-primary)' },
  agentCell: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--t-spacing-1)' },
  error: { color: 'var(--t-color-red)' },
};

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section style={styles.card}>
    <h3 style={styles.cardTitle}>{title}</h3>
    {children}
  </section>
);

const Kpi = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <section style={styles.card}>
    <span style={styles.hint}>{label}</span>
    <span style={styles.kpiValue}>{value}</span>
    <span style={styles.hint}>{hint}</span>
  </section>
);

const Line = ({ label, value }: { label: string; value: string }) => (
  <div style={styles.line}>
    <span>{label}</span>
    <span style={styles.strong}>{value}</span>
  </div>
);

const statusTag = (status: AgentStatus, t: Translate, number: (value: number) => string): { label: string; color: ThemeColor } =>
  status.kind === 'FROZEN'
    ? { label: t(msg('Frozen · {days} days'), { days: number(status.days) }), color: 'amber' }
    : status.kind === 'INACTIVE'
      ? { label: t(msg('Inactive')), color: 'gray' }
      : { label: t(msg('Active')), color: 'green' };

const Report = () => {
  const { t, locale } = useTranslate();
  const colorScheme = useColorScheme();
  const [period, setPeriod] = useState<ReportPeriodKind>('MONTH');
  const [offset, setOffset] = useState(0);
  const [agentId, setAgentId] = useState('ALL');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;

    setError(null);
    new RestApiClient()
      .post<ReportResponse>('/s/reports', { period, offset, agentId })
      .then((response) => current && setReport(response))
      .catch((caught) => {
        current && setError(serverErrorMessage(caught, ERROR_MESSAGES, t, msg('Something went wrong.')));
      });

    return () => {
      current = false;
    };
  }, [period, offset, agentId]);

  const number = (value: number) => new Intl.NumberFormat(intlLocale(locale)).format(value);
  const percent = (value: number | null) =>
    value === null ? '—' : new Intl.NumberFormat(intlLocale(locale), { style: 'percent', maximumFractionDigits: 0 }).format(value);
  const usdt = (value: number) => `${new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 1 }).format(value)} USDT`;
  const dayLabel = (iso: string) => formatAt(new Date(iso), locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const monthLabel = (date: Date) => formatAt(date, locale, { month: 'long', year: 'numeric' });
  const periodLabel = ({ kind, start, end }: ReportResponse['period']) =>
    kind === 'ALL'
      ? t(msg('All time'))
      : kind === 'MONTH'
        ? monthLabel(new Date(new Date(start).getTime() + 86_400_000))
        : kind === 'DAY'
          ? dayLabel(start)
          : `${dayLabel(start)} – ${dayLabel(new Date(new Date(end).getTime() - 1).toISOString())}`;
  const jalaliMonthLabel = (jalaliMonth: string) => {
    const [year, month] = jalaliMonth.split('-').map(Number);

    return monthLabel(new Date(jalaliMonthStart(year, month).getTime() + 15 * 86_400_000));
  };

  const theme = colorScheme === 'dark' ? THEME_DARK : THEME_LIGHT;
  const isRtl = locale === 'fa-IR';
  const isStaff = report?.overall !== null && report !== null;

  const toolbar = (
    <div style={styles.toolbar}>
      {isStaff && report.agents.length > 0 && (
        <Select.Root value={agentId} onValueChange={(value) => setAgentId((value as string | null) ?? 'ALL')}>
          <Select.Trigger aria-label={t(msg('Agent'))} style={{ width: 200 }}>
            <Select.Value>{(value: string) => (value === 'ALL' ? t(msg('All agents')) : (report.agents.find(({ id }) => id === value)?.name ?? ''))}</Select.Value>
            <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner sideOffset={4} align="start">
              <Select.Popup>
                {[{ id: 'ALL', name: t(msg('All agents')) }, ...report.agents].map((agent) => (
                  <Select.Item key={agent.id} value={agent.id}>
                    <Select.ItemText>{agent.name}</Select.ItemText>
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      )}
      {period !== 'ALL' && (
        <ButtonGroup variant="outline" color="neutral" size="sm" attached>
          <Button aria-label={t(msg('Previous period'))} onClick={() => setOffset(offset - 1)}>
            {isRtl ? '›' : '‹'}
          </Button>
          <Button aria-label={t(msg('Next period'))} disabled={offset >= 0} onClick={() => setOffset(offset + 1)}>
            {isRtl ? '‹' : '›'}
          </Button>
        </ButtonGroup>
      )}
      <ButtonGroup color="neutral" size="sm" attached>
        {PERIODS.map(({ kind, label }) => (
          <Button
            key={kind}
            variant={period === kind ? 'solid' : 'outline'}
            color={period === kind ? 'accent' : 'neutral'}
            onClick={() => {
              setPeriod(kind);
              setOffset(0);
            }}
          >
            {t(label)}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );

  const header = (title: string, subtitle: string) => (
    <div style={styles.header}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--t-spacing-1)' }}>
        <h2 style={styles.title}>{title}</h2>
        <span style={styles.hint}>{subtitle}</span>
      </div>
      {toolbar}
    </div>
  );

  const topReasonsCard = (reasons: ReportResponse['topReasons']) => {
    const max = Math.max(1, ...reasons.map(({ count }) => count));

    return (
      <Card title={t(msg('Top reasons'))}>
        {reasons.length === 0 && <span style={styles.hint}>{t(msg('No reasons recorded in this period.'))}</span>}
        {reasons.map((reason) => (
          <div key={reason.name} style={styles.bar}>
            <span>{reason.name}</span>
            <div style={styles.track}>
              <div style={{ ...styles.fill, width: `${(reason.count / max) * 100}%` }} />
            </div>
            <span style={styles.strong}>{number(reason.count)}</span>
          </div>
        ))}
      </Card>
    );
  };

  const agentView = (response: ReportResponse, row: Row) => {
    const closed = row.deals.won + row.deals.lost;
    const isCurrentMonth = response.period.kind === 'MONTH' && response.period.offset === 0;
    const incomeStatus = (status: string) =>
      status === 'PAID' ? { label: t(msg('Paid')), color: 'green' as const } : { label: t(msg('Awaiting payment')), color: 'amber' as const };

    return (
      <>
        {header(t(msg('My report')), `${t(msg('Only your numbers'))} · ${periodLabel(response.period)} · ${t(msg('Frozen days do not count as working days'))}`)}
        <div style={styles.kpis}>
          <Kpi
            label={t(msg('Calls'))}
            value={number(row.calls.total)}
            hint={t(msg('Follow-up {followUp} · Retention {retention}'), { followUp: number(row.calls.followUp), retention: number(row.calls.retention) })}
          />
          <Kpi
            label={t(msg('Answered / unanswered'))}
            value={`${number(row.calls.answered)} / ${number(row.calls.unanswered)}`}
            hint={t(msg('Answer rate {rate}'), { rate: percent(row.calls.answerRate) })}
          />
          <Kpi label={t(msg('Conversion'))} value={percent(row.conversion)} hint={t(msg('{won} won of {closed} closed'), { won: number(row.deals.won), closed: number(closed) })} />
          <Kpi label={t(msg('Attributed revenue'))} value={usdt(row.revenue)} hint={t(msg('Commission {commission}'), { commission: usdt(row.commission) })} />
        </div>
        <div style={styles.grid}>
          <Card title={t(msg('Deals'))}>
            <Line label={t(msg('Added'))} value={number(row.deals.added)} />
            <Line label={t(msg('Successful'))} value={number(row.deals.won)} />
            <Line label={t(msg('Lost'))} value={number(row.deals.lost)} />
            {Object.entries(CLOSE_REASON_LABELS).map(([reason, label]) => (
              <Line key={reason} label={t(label)} value={number(row.deals.byCloseReason[reason] ?? 0)} />
            ))}
          </Card>
          <Card title={t(msg('Codes and plan adherence'))}>
            <Line label={t(msg('Codes activated'))} value={number(row.codes.activated)} />
            <Line label={t(msg('Codes used'))} value={number(row.codes.used)} />
            <Line label={t(msg('On-time attempts'))} value={percent(row.adherence.rate)} />
            <Line label={t(msg('Overdue calls'))} value={number(row.calls.reds)} />
            <Line label={t(msg('Calls per working day'))} value={row.calls.perWorkingDay === null ? '—' : new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 1 }).format(row.calls.perWorkingDay)} />
          </Card>
          {topReasonsCard(response.topReasons)}
        </div>
        <Card title={t(msg('Commission and monthly income'))}>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.headCell}>{t(msg('Month'))}</th>
                  <th style={styles.headCell}>{t(msg('Commission'))}</th>
                  <th style={styles.headCell}>{t(msg('Status'))}</th>
                </tr>
              </thead>
              <tbody>
                {isCurrentMonth && row.income === null && (
                  <tr>
                    <td style={styles.cell}>{t(msg('{month} (current)'), { month: periodLabel(response.period) })}</td>
                    <td style={styles.cell}>{usdt(row.commission)}</td>
                    <td style={styles.cell}>
                      <Tag color="gray" variant="soft">{t(msg('Collecting'))}</Tag>
                    </td>
                  </tr>
                )}
                {response.incomeHistory.map((income) => {
                  const status = incomeStatus(income.status);

                  return (
                    <tr key={income.jalaliMonth}>
                      <td style={styles.cell}>{jalaliMonthLabel(income.jalaliMonth)}</td>
                      <td style={styles.cell}>{usdt(income.totalUsdt)}</td>
                      <td style={styles.cell}>
                        <Tag color={status.color} variant="soft">
                          {income.paidAt === null ? status.label : `${status.label} · ${formatAt(new Date(income.paidAt), locale, { day: 'numeric', month: 'long' })}`}
                        </Tag>
                      </td>
                    </tr>
                  );
                })}
                {!isCurrentMonth && response.incomeHistory.length === 0 && (
                  <tr>
                    <td style={styles.cell} colSpan={3}>
                      <span style={styles.hint}>{t(msg('No monthly income yet.'))}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </>
    );
  };

  const staffView = (response: ReportResponse, overall: Summary) => {
    const sortColumn = RANKING_COLUMNS.find(({ key }) => key === sortKey);
    const rows = sortColumn ? [...response.rows].sort((left, right) => (sortColumn.value(right) ?? -1) - (sortColumn.value(left) ?? -1)) : response.rows;
    const formatColumn = (column: RankingColumn, row: Row) => {
      const value = column.value(row);

      return value === null ? '—' : column.format === 'percent' ? percent(value) : number(value);
    };

    return (
      <>
        {header(t(msg('Management dashboard')), periodLabel(response.period))}
        {response.longFreezes.map((freeze) => (
          <div key={freeze.agentId} style={styles.banner}>
            <span style={{ flex: 1 }}>
              <span style={styles.strong}>{t(msg('Long freeze:'))}</span>{' '}
              {t(msg('{name} has been frozen for {days} days · {waiting} contacts waiting'), {
                name: freeze.name,
                days: number(freeze.days),
                waiting: number(freeze.waitingContacts),
              })}
            </span>
            <Button variant="outline" color="neutral" size="sm" onClick={() => openAgent(freeze.agentId)}>
              {t(msg('Unfreeze or transfer'))}
            </Button>
          </div>
        ))}
        <div style={styles.kpis}>
          <Kpi label={t(msg('Team calls'))} value={number(overall.calls.total)} hint={t(msg('Answer rate {rate}'), { rate: percent(overall.calls.answerRate) })} />
          <Kpi
            label={t(msg('Closed deals'))}
            value={number(overall.deals.won + overall.deals.lost)}
            hint={t(msg('Successful {won}'), { won: number(overall.deals.won) })}
          />
          <Kpi label={t(msg('Team conversion'))} value={percent(overall.conversion)} hint={t(msg('Successful ÷ closed'))} />
          <Kpi label={t(msg('Attributed revenue'))} value={usdt(overall.revenue)} hint={t(msg('Commission {commission}'), { commission: usdt(overall.commission) })} />
        </div>
        <Card title={`${t(msg('Agent ranking'))} · ${periodLabel(response.period)}`}>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.headCell}>#</th>
                  <th style={styles.headCell}>{t(msg('Agent'))}</th>
                  {RANKING_COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      style={{ ...styles.headCell, ...styles.sortable, ...(sortKey === column.key ? styles.sorted : {}) }}
                      onClick={() => setSortKey(sortKey === column.key ? null : column.key)}
                    >
                      {t(column.label)}
                      {sortKey === column.key ? ' ↓' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const tag = statusTag(row.status, t, number);

                  return (
                    <tr key={row.agentId}>
                      <td style={styles.cell}>{row.rank === null ? '' : number(row.rank)}</td>
                      <td style={styles.cell}>
                        <div style={styles.agentCell}>
                          <span style={styles.strong}>{row.name}</span>
                          <Tag color={tag.color} variant="soft">{tag.label}</Tag>
                        </div>
                      </td>
                      {RANKING_COLUMNS.map((column) => (
                        <td key={column.key} style={styles.cell}>{formatColumn(column, row)}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <div style={styles.grid}>
          <Card title={t(msg('Campaigns'))}>
            {response.campaigns.length === 0 && <span style={styles.hint}>{t(msg('No calls in this period.'))}</span>}
            {response.campaigns.map((campaign) => (
              <Line
                key={`${campaign.kind}-${campaign.label ?? ''}`}
                label={campaign.kind === 'CAMPAIGN' ? (campaign.label ?? '') : campaign.kind === 'REBUY' ? t(msg('Rebuy')) : t(msg('Retention'))}
                value={`${t(msg('{calls} calls'), { calls: number(campaign.calls) })} · ${usdt(campaign.revenue)}`}
              />
            ))}
          </Card>
          {topReasonsCard(response.topReasons)}
        </div>
        {response.failedEvents !== null && (
          <span style={styles.hint}>
            {t(msg('Failed platform events'))}: {number(response.failedEvents)}
          </span>
        )}
      </>
    );
  };

  const content = () => {
    if (error !== null) {
      return <span style={styles.error}>{error}</span>;
    }

    if (report === null) {
      return <Skeleton style={{ height: 320 }} />;
    }

    if (report.overall !== null) {
      return staffView(report, report.overall);
    }

    const [own] = report.rows;

    return own === undefined ? <span style={styles.error}>{t(msg('You have no agent record.'))}</span> : agentView(report, own);
  };

  return (
    <ThemeProvider colorScheme={colorScheme} theme={theme}>
      <div style={styles.container} data-testid="proopco-report">
        {content()}
      </div>
    </ThemeProvider>
  );
};

export default defineFrontComponent({
  universalIdentifier: REPORT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'report',
  description: 'Sales report: an Agent sees their own numbers, Full Admin and Supervisors see the team dashboard with ranking and long-freeze warnings.',
  component: Report,
  widgetAvailability: { pageLayoutType: PageLayoutType.DASHBOARD },
});
