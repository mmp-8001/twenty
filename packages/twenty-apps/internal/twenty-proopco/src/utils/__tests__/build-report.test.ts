import { describe, expect, it } from 'vitest';

import { buildReport, reportRangeOf, type ReportData } from 'src/utils/build-report.util';

const empty: ReportData = { calls: [], followups: [], commissions: [], activations: [], touches: [], freezes: [], callReasons: [] };

describe('reportRangeOf', () => {
  // 2024-09-25 is a Wednesday; Tehran Saturday 21 September is the week start.
  const now = new Date('2024-09-25T10:00:00Z');

  it('starts a week on Saturday at Tehran midnight', () => {
    const { start, end } = reportRangeOf('WEEKLY', now);

    expect(start?.toISOString()).toBe('2024-09-20T20:30:00.000Z');
    expect(end.toISOString()).toBe('2024-09-27T20:30:00.000Z');
  });

  it('uses the Tehran day, which starts at 20:30 UTC', () => {
    const { start } = reportRangeOf('DAILY', new Date('2024-09-25T21:00:00Z'));

    expect(start?.toISOString()).toBe('2024-09-25T20:30:00.000Z');
  });

  it('uses the Jalali month and no start for all-time', () => {
    expect(reportRangeOf('MONTHLY', now).start?.toISOString()).toBe('2024-09-21T20:30:00.000Z');
    expect(reportRangeOf('ALL', now).start).toBeNull();
  });
});

describe('buildReport', () => {
  const now = new Date('2024-11-10T12:00:00Z');
  const range = reportRangeOf('MONTHLY', now);

  it('RS3: added in the earlier month, successful and revenue in the later one', () => {
    const data: ReportData = {
      ...empty,
      followups: [
        { adminId: 'k', status: 'SUCCESSFUL', addedAt: '2024-10-16T10:00:00Z', closedAt: '2024-11-01T10:00:00Z', failureReason: null },
      ],
      commissions: [{ adminId: 'k', amountUsdt: 100, commissionUsdt: 2, purchasedAt: '2024-11-01T10:00:00Z' }],
    };
    const october = reportRangeOf('MONTHLY', new Date('2024-10-20T10:00:00Z'));

    expect(buildReport({ data, adminId: 'k', range: october, now }).cases).toMatchObject({ added: 1, outcomes: {} });
    expect(buildReport({ data, adminId: 'k', range: october, now }).revenueUsdt).toBe(0);

    const november = buildReport({ data, adminId: 'k', range, now });

    expect(november.cases).toMatchObject({ added: 0, outcomes: { SUCCESSFUL: 1 } });
    expect(november.revenueUsdt).toBe(100);
    expect(november.commissionUsdt).toBe(2);
  });

  it('RPT-04: purchase before call is outside the conversion rate', () => {
    const closedAt = '2024-11-02T10:00:00Z';
    const data: ReportData = {
      ...empty,
      followups: [
        { adminId: 'k', status: 'SUCCESSFUL', addedAt: null, closedAt, failureReason: null },
        { adminId: 'k', status: 'PURCHASE_BEFORE_CALL', addedAt: null, closedAt, failureReason: null },
        { adminId: 'k', status: 'FAILED', addedAt: null, closedAt, failureReason: { title: 'Too expensive' } },
      ],
    };
    const report = buildReport({ data, adminId: 'k', range, now });

    expect(report.conversionRate).toBe(50);
    expect(report.cases.failedByReason).toEqual({ 'Too expensive': 1 });
  });

  it('RS4: another admin never leaks into a scoped report', () => {
    const data: ReportData = {
      ...empty,
      calls: [
        { id: 'c1', adminId: 'a', kind: 'FOLLOWUP', isAnswered: true, startedAt: '2024-11-02T10:00:00Z' },
        { id: 'c2', adminId: 'b', kind: 'RETENTION', isAnswered: false, startedAt: '2024-11-02T10:00:00Z' },
      ],
    };

    expect(buildReport({ data, adminId: 'a', range, now }).calls.followup.total).toBe(1);
    expect(buildReport({ data, adminId: 'a', range, now }).calls.retention.total).toBe(0);
    expect(buildReport({ data, adminId: null, range, now }).calls.retention.answerRate).toBe(0);
  });

  it('removes freeze days from the working days', () => {
    const data: ReportData = {
      ...empty,
      freezes: [{ adminId: 'a', frozenAt: '2024-11-03T20:30:00Z', unfrozenAt: '2024-11-05T20:30:00Z' }],
    };
    const report = buildReport({ data, adminId: 'a', range, now: new Date('2024-11-10T20:30:00Z') });

    expect(report.frozenDays).toBe(2);
    // Aban 1403 began 22 October; 20 days elapsed by the evening of 10 November.
    expect(report.workingDays).toBe(18);
  });
});
