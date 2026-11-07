import { DAY_MS } from 'src/constants/time.constant';
import { jalaliMonthStart } from 'src/utils/jalali.util';
import { type Report } from 'src/utils/build-report.util';

export type BreakdownEntry = { key: string; label: string; count: number };

export type OutcomeTone = 'success' | 'failure' | 'neutral';

const SUCCESS_OUTCOMES = ['SUCCESSFUL', 'PURCHASE_BEFORE_CALL'];
const FAILURE_OUTCOMES = ['FAILED', 'EXPIRED', 'NO_ANSWER_FIRST_CALL', 'RELEASED_72H', 'RELEASED_BY_MANAGER'];

export const outcomeTone = (status: string): OutcomeTone =>
  SUCCESS_OUTCOMES.includes(status) ? 'success' : FAILURE_OUTCOMES.includes(status) ? 'failure' : 'neutral';

// Biggest first; equal counts keep a stable alphabetical order.
export const sortBreakdown = (entries: BreakdownEntry[]) =>
  [...entries].sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

export const formatNumber = (locale: string, value: number) => new Intl.NumberFormat(locale).format(value);

// The report stores rates as 0-100 numbers, null when there was nothing to divide by.
export const formatPercent = (locale: string, rate: number | null) =>
  rate === null
    ? null
    : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(rate / 100);

export const formatUsdt = (locale: string, value: number | null) =>
  value === null ? '' : new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);

export const formatJalaliMonth = (locale: string, year: number, month: number) =>
  new Intl.DateTimeFormat(`${locale}-u-ca-persian`, { timeZone: 'Asia/Tehran', year: 'numeric', month: 'long' }).format(
    new Date(jalaliMonthStart(year, month).getTime() + 10 * DAY_MS),
  );

// Best conversion first, then revenue; admins without data go last.
export const rankAdmins = <TAdmin extends { report: Report }>(admins: TAdmin[]) =>
  [...admins].sort(
    (left, right) =>
      (right.report.conversionRate ?? -1) - (left.report.conversionRate ?? -1) ||
      right.report.revenueUsdt - left.report.revenueUsdt,
  );
