import { type CSSProperties, useEffect, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent, PageLayoutType } from 'twenty-sdk/define';
import { msg, t, useLocale } from 'twenty-sdk/front-component';

import { REPORT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readServerError } from 'src/front-components/utils/server-error.util';

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
type Row = Summary & { agentId: string; name: string; rank: number | null };
type ReportResponse = {
  period: { kind: string; offset: number; start: string; end: string };
  rows: Row[];
  overall: Summary | null;
  campaigns: { label: string | null; kind: 'CAMPAIGN' | 'REBUY' | 'RETENTION'; calls: number; revenue: number }[];
  topReasons: { name: string; count: number }[];
  agents: { id: string; name: string }[];
  failedEvents: number | null;
};

const PERIODS = [
  { kind: 'DAY', label: msg('Day') },
  { kind: 'WEEK', label: msg('Week') },
  { kind: 'MONTH', label: msg('Month') },
  { kind: 'ALL', label: msg('All time') },
];

const ERROR_MESSAGES: Record<string, ReturnType<typeof msg>> = {
  NO_ACCESS: msg('You have no access to reports.'),
  NO_AGENT: msg('You have no agent record.'),
};

type Column = { key: string; label: ReturnType<typeof msg>; value: (summary: Summary & { name?: string; rank?: number | null }) => number | string | null; format?: 'percent' | 'usdt' | 'decimal' };

const COLUMNS: Column[] = [
  { key: 'revenue', label: msg('Revenue'), value: (row) => row.revenue, format: 'usdt' },
  { key: 'conversion', label: msg('Conversion'), value: (row) => row.conversion, format: 'percent' },
  { key: 'added', label: msg('Added'), value: (row) => row.deals.added },
  { key: 'won', label: msg('Successful'), value: (row) => row.deals.won },
  { key: 'lost', label: msg('Lost'), value: (row) => row.deals.lost },
  { key: 'calls', label: msg('Calls'), value: (row) => row.calls.total },
  { key: 'answered', label: msg('Answered'), value: (row) => row.calls.answered },
  { key: 'answerRate', label: msg('Answer rate'), value: (row) => row.calls.answerRate, format: 'percent' },
  { key: 'perDay', label: msg('Calls per working day'), value: (row) => row.calls.perWorkingDay, format: 'decimal' },
  { key: 'adherence', label: msg('Plan adherence'), value: (row) => row.adherence.rate, format: 'percent' },
  { key: 'reds', label: msg('Overdue calls'), value: (row) => row.calls.reds },
  { key: 'activated', label: msg('Codes activated'), value: (row) => row.codes.activated },
  { key: 'used', label: msg('Codes used'), value: (row) => row.codes.used },
  { key: 'commission', label: msg('Commission'), value: (row) => row.commission, format: 'usdt' },
];

const styles: Record<string, CSSProperties> = {
  root: { fontFamily: 'var(--t-font-family)', fontSize: 'var(--t-font-size-sm)', color: 'var(--t-font-color-primary)', background: 'var(--t-background-primary)', padding: 'var(--t-spacing-3)', boxSizing: 'border-box' },
  bar: { display: 'flex', flexWrap: 'wrap', gap: 'var(--t-spacing-2)', alignItems: 'center', marginBlockEnd: 'var(--t-spacing-3)' },
  button: { height: 'var(--t-spacing-7)', padding: '0 var(--t-spacing-2)', borderRadius: 'var(--t-border-radius-sm)', border: '1px solid var(--t-border-color-medium)', background: 'var(--t-background-secondary)', color: 'var(--t-font-color-secondary)', cursor: 'pointer' },
  active: { background: 'var(--t-color-blue)', color: 'var(--t-font-color-inverted)' },
  table: { borderCollapse: 'collapse', width: '100%', marginBlockEnd: 'var(--t-spacing-3)' },
  cell: { padding: 'var(--t-spacing-1) var(--t-spacing-2)', textAlign: 'start', borderBlockEnd: '1px solid var(--t-border-color-light)' },
  head: { cursor: 'pointer', fontWeight: 'var(--t-font-weight-semi-bold)', color: 'var(--t-font-color-secondary)' },
  sorted: { background: 'var(--t-background-transparent-blue)' },
  muted: { color: 'var(--t-font-color-tertiary)' },
  error: { color: 'var(--t-color-red)' },
};

const Report = () => {
  const locale = useLocale();
  const [period, setPeriod] = useState('MONTH');
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
        const { code, message } = readServerError(caught);
        const descriptor = code === null ? undefined : ERROR_MESSAGES[code];

        current && setError(descriptor ? t(descriptor) : (message ?? t(msg('Something went wrong.'))));
      });

    return () => {
      current = false;
    };
  }, [period, offset, agentId]);

  const number = new Intl.NumberFormat(locale);
  const formatCell = (value: number | string | null, format?: Column['format']) => {
    if (value === null) {
      return '-';
    }

    if (typeof value === 'string') {
      return value;
    }

    return format === 'percent'
      ? new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(value)
      : format === 'usdt'
        ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)} USDT`
        : format === 'decimal'
          ? new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)
          : number.format(value);
  };
  const dateLabel = (iso: string) =>
    new Intl.DateTimeFormat(`${locale}-u-ca-persian`, { timeZone: 'Asia/Tehran', dateStyle: 'medium' }).format(new Date(iso));
  const periodLabel = (response: ReportResponse) =>
    response.period.kind === 'ALL'
      ? t(msg('All time'))
      : response.period.kind === 'MONTH'
        ? new Intl.DateTimeFormat(`${locale}-u-ca-persian`, { timeZone: 'Asia/Tehran', month: 'long', year: 'numeric' }).format(new Date(new Date(response.period.start).getTime() + 86_400_000))
        : response.period.kind === 'DAY'
          ? dateLabel(response.period.start)
          : `${dateLabel(response.period.start)} - ${dateLabel(new Date(new Date(response.period.end).getTime() - 1).toISOString())}`;

  const sortColumn = COLUMNS.find(({ key }) => key === sortKey);
  const rows = report
    ? sortColumn
      ? [...report.rows].sort((left, right) => Number(sortColumn.value(right) ?? -1) - Number(sortColumn.value(left) ?? -1))
      : report.rows
    : [];

  return (
    <div style={styles.root} data-testid="proopco-report">
      <div style={styles.bar}>
        {PERIODS.map(({ kind, label }) => (
          <button key={kind} type="button" style={{ ...styles.button, ...(period === kind ? styles.active : {}) }} onClick={() => { setPeriod(kind); setOffset(0); }}>
            {t(label)}
          </button>
        ))}
        {period !== 'ALL' && (
          <>
            <button type="button" style={styles.button} aria-label={t(msg('Previous period'))} onClick={() => setOffset(offset - 1)}>{'<'}</button>
            <button type="button" style={styles.button} aria-label={t(msg('Next period'))} disabled={offset >= 0} onClick={() => setOffset(offset + 1)}>{'>'}</button>
          </>
        )}
        {report && <strong>{periodLabel(report)}</strong>}
        {report && report.agents.length > 0 && (
          <select style={styles.button} value={agentId} onChange={(event) => setAgentId(event.target.value)} aria-label={t(msg('Agent'))}>
            <option value="ALL">{t(msg('All agents'))}</option>
            {report.agents.map((agent) => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
        )}
      </div>
      {error && <div style={styles.error}>{error}</div>}
      {report && (
        <>
          {report.failedEvents !== null && (
            <div style={styles.muted}>{t(msg('Failed platform events'))}: {number.format(report.failedEvents)}</div>
          )}
          <table style={styles.table}>
            <thead>
              <tr>
                {report.overall && <th style={styles.cell}>#</th>}
                <th style={styles.cell}>{t(msg('Agent'))}</th>
                {COLUMNS.map((column) => (
                  <th key={column.key} style={{ ...styles.cell, ...styles.head, ...(sortKey === column.key ? styles.sorted : {}) }} onClick={() => setSortKey(column.key)}>
                    {t(column.label)}
                  </th>
                ))}
                {period === 'MONTH' && <th style={styles.cell}>{t(msg('Monthly income'))}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.agentId}>
                  {report.overall && <td style={styles.cell}>{row.rank === null ? '' : number.format(row.rank)}</td>}
                  <td style={styles.cell}>{row.name}</td>
                  {COLUMNS.map((column) => (
                    <td key={column.key} style={{ ...styles.cell, ...(sortKey === column.key ? styles.sorted : {}) }}>{formatCell(column.value(row), column.format)}</td>
                  ))}
                  {period === 'MONTH' && (
                    <td style={styles.cell}>
                      {row.income ? `${formatCell(row.income.totalUsdt, 'usdt')} · ${row.income.status === 'PAID' ? t(msg('Paid')) : t(msg('Awaiting payment'))}` : '-'}
                    </td>
                  )}
                </tr>
              ))}
              {report.overall && (
                <tr style={{ fontWeight: 'var(--t-font-weight-semi-bold)' }}>
                  <td style={styles.cell} />
                  <td style={styles.cell}>{t(msg('Overall'))}</td>
                  {COLUMNS.map((column) => (
                    <td key={column.key} style={styles.cell}>{formatCell(column.value(report.overall as Summary), column.format)}</td>
                  ))}
                  {period === 'MONTH' && <td style={styles.cell} />}
                </tr>
              )}
            </tbody>
          </table>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.cell}>{t(msg('Campaign'))}</th>
                <th style={styles.cell}>{t(msg('Calls'))}</th>
                <th style={styles.cell}>{t(msg('Revenue'))}</th>
              </tr>
            </thead>
            <tbody>
              {report.campaigns.map((campaign) => (
                <tr key={`${campaign.kind}-${campaign.label ?? ''}`}>
                  <td style={styles.cell}>
                    {campaign.kind === 'CAMPAIGN' ? campaign.label : campaign.kind === 'REBUY' ? t(msg('Rebuy')) : t(msg('Retention'))}
                  </td>
                  <td style={styles.cell}>{number.format(campaign.calls)}</td>
                  <td style={styles.cell}>{formatCell(campaign.revenue, 'usdt')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.topReasons.length > 0 && (
            <div>
              <strong>{t(msg('Top reasons'))}</strong>
              <ol>
                {report.topReasons.map((reason) => (
                  <li key={reason.name}>{reason.name} · {number.format(reason.count)}</li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: REPORT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'report',
  description: 'Sales report: calls, deals, revenue, codes, plan adherence and commission by period.',
  component: Report,
  widgetAvailability: { pageLayoutType: PageLayoutType.DASHBOARD },
});
