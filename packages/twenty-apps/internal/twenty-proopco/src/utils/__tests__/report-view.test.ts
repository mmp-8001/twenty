import { describe, expect, it } from 'vitest';

import { type Report } from 'src/utils/build-report.util';
import {
  formatJalaliMonth,
  formatPercent,
  outcomeTone,
  rankAdmins,
  sortBreakdown,
} from 'src/utils/report-view.util';

const reportWith = (conversionRate: number | null, revenueUsdt: number) => ({ conversionRate, revenueUsdt }) as Report;

describe('sortBreakdown', () => {
  it('orders by count then label', () => {
    const sorted = sortBreakdown([
      { key: 'b', label: 'B', count: 1 },
      { key: 'c', label: 'C', count: 3 },
      { key: 'a', label: 'A', count: 1 },
    ]);

    expect(sorted.map(({ key }) => key)).toEqual(['c', 'a', 'b']);
  });
});

describe('outcomeTone', () => {
  it('colours successes, failures and the rest', () => {
    expect(outcomeTone('SUCCESSFUL')).toBe('success');
    expect(outcomeTone('FAILED')).toBe('failure');
    expect(outcomeTone('IN_PROGRESS')).toBe('neutral');
  });
});

describe('formatPercent', () => {
  it('returns null without data and a locale percent otherwise', () => {
    expect(formatPercent('en', null)).toBeNull();
    expect(formatPercent('en', 62.5)).toBe('62.5%');
    expect(formatPercent('fa-IR', 50)).toMatch(/۵۰/);
  });
});

describe('rankAdmins', () => {
  it('sorts by conversion, then revenue, with no-data last', () => {
    const ranked = rankAdmins([
      { name: 'none', report: reportWith(null, 900) },
      { name: 'low', report: reportWith(10, 5) },
      { name: 'high-small', report: reportWith(50, 1) },
      { name: 'high-big', report: reportWith(50, 10) },
    ]);

    expect(ranked.map(({ name }) => name)).toEqual(['high-big', 'high-small', 'low', 'none']);
  });
});

describe('formatJalaliMonth', () => {
  it('names the Jalali month', () => {
    expect(formatJalaliMonth('en', 1404, 7)).toMatch(/Mehr.*1404/);
  });
});
