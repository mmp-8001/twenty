import { describe, expect, it } from 'vitest';

import { buildReport, compareByRank, conversionRate, reportPeriodOf, type ReportData } from 'src/utils/report.util';

describe('reportPeriodOf', () => {
  it('Day is the Tehran day', () => {
    const { start, end } = reportPeriodOf('DAY', new Date('2025-10-30T21:00:00Z'), 0);

    expect(start.toISOString()).toBe('2025-10-30T20:30:00.000Z');
    expect(end.toISOString()).toBe('2025-10-31T20:30:00.000Z');
  });

  it('Week starts on Saturday in Tehran', () => {
    // Thursday 30 Oct 2025 -> Saturday 25 Oct 2025
    const { start, end } = reportPeriodOf('WEEK', new Date('2025-10-30T10:00:00Z'), 0);

    expect(start.toISOString()).toBe('2025-10-24T20:30:00.000Z');
    expect(end.toISOString()).toBe('2025-10-31T20:30:00.000Z');
  });

  it('a Saturday belongs to the week it starts', () => {
    const { start } = reportPeriodOf('WEEK', new Date('2025-10-24T21:00:00Z'), 0);

    expect(start.toISOString()).toBe('2025-10-24T20:30:00.000Z');
  });

  it('Jalali month steps back and forth across a year boundary', () => {
    const { start, end } = reportPeriodOf('MONTH', new Date('2026-04-01T10:00:00Z'), -1);

    expect(start.toISOString()).toBe('2026-02-19T20:30:00.000Z');
    expect(end.toISOString()).toBe('2026-03-20T20:30:00.000Z');
    expect(reportPeriodOf('MONTH', new Date('2026-04-01T10:00:00Z'), 0).start.toISOString()).toBe('2026-03-20T20:30:00.000Z');
  });

  it('All time ignores the offset', () => {
    expect(reportPeriodOf('ALL', new Date('2025-10-30T10:00:00Z'), -3).start.getTime()).toBe(0);
  });
});

describe('conversionRate', () => {
  it('is Won / (Won + Lost) and null without closed deals', () => {
    expect(conversionRate(1, 3)).toBe(0.25);
    expect(conversionRate(0, 0)).toBeNull();
  });
});

describe('compareByRank', () => {
  const row = (name: string, revenue: number, conversion: number | null) => ({ name, revenue, conversion });

  it('ranks revenue desc, then conversion desc, then name', () => {
    const rows = [row('Cy', 5, 0.1), row('Bo', 10, 0.2), row('Al', 10, 0.5), row('Ab', 5, 0.1), row('Zed', 5, null)];

    expect(rows.sort(compareByRank).map(({ name }) => name)).toEqual(['Al', 'Bo', 'Ab', 'Cy', 'Zed']);
  });
});

describe('buildReport (RS3: each event lands in its own period)', () => {
  const data = (overrides: Partial<ReportData>): ReportData => ({
    calls: [],
    dealsOpened: [],
    dealsClosed: [],
    purchases: [],
    codesActivated: [],
    codesUsed: [],
    ...overrides,
  });
  const campaign = { kind: 'CAMPAIGN' as const, id: 'c1', name: 'Mehr launch' };
  const agent = (id: string, name: string) => ({ id, name, workingDays: 10, income: null });

  it('shows Added in the month of the deal and Successful and revenue in the month of the close and purchase', () => {
    const mehr = buildReport({ agents: [agent('K', 'K')], withTeam: false, campaignAgentId: null, data: data({ dealsOpened: [{ agentId: 'K' }], calls: [{ agentId: 'K', answered: true, callKind: 'FOLLOW_UP', wasOverdue: false, campaign, reasons: ['Price'] }] }) });
    const aban = buildReport({ agents: [agent('K', 'K')], withTeam: false, campaignAgentId: null, data: data({ dealsClosed: [{ agentId: 'K', dealStage: 'WON', closeReason: null, slots: ['DONE', 'MISSED'] }], purchases: [{ agentId: 'K', amountUsdt: 100, commissionUsdt: 2, campaign }] }) });

    expect([mehr.rows[0].deals.added, mehr.rows[0].deals.won, mehr.rows[0].revenue]).toEqual([1, 0, 0]);
    expect([aban.rows[0].deals.added, aban.rows[0].deals.won, aban.rows[0].revenue, aban.rows[0].conversion]).toEqual([0, 1, 100, 1]);
    expect(aban.rows[0].adherence.rate).toBe(0.5);
    expect(mehr.topReasons).toEqual([{ name: 'Price', count: 1 }]);
  });

  it('gives an Agent no rank and no overall, and the team both', () => {
    const calls = [{ agentId: 'A', answered: false, callKind: 'RETENTION' as const, wasOverdue: true, campaign: { kind: 'RETENTION' as const }, reasons: [] }];
    const own = buildReport({ agents: [agent('A', 'A')], withTeam: false, campaignAgentId: null, data: data({ calls }) });
    const team = buildReport({ agents: [agent('A', 'A'), agent('B', 'B')], withTeam: true, campaignAgentId: null, data: data({ calls, purchases: [{ agentId: 'B', amountUsdt: 5, commissionUsdt: 0, campaign }] }) });

    expect([own.overall, own.rows[0].rank]).toEqual([null, null]);
    expect(team.rows.map(({ agentId, rank }) => [agentId, rank])).toEqual([['B', 1], ['A', 2]]);
    expect(team.overall?.calls.reds).toBe(1);
    expect(team.campaigns.map(({ kind }) => kind)).toEqual(['CAMPAIGN', 'RETENTION']);
  });
});
