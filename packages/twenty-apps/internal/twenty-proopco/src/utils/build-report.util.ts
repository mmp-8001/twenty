import { type ReportPeriod } from 'src/constants/income-report.constant';
import { startOfTehranDay } from 'src/utils/call-windows.util';
import { jalaliMonthBounds, jalaliPartsOf } from 'src/utils/jalali.util';
import { fromMicros, toMicros } from 'src/utils/monthly-income.util';
import { DAY_MS, TEHRAN_OFFSET_MS } from 'src/constants/time.constant';

export type ReportRange = { start: Date | null; end: Date };

// Daily, weekly (the Persian week starts on Saturday), the current Jalali month, or everything.
export const reportRangeOf = (period: ReportPeriod, now: Date): ReportRange => {
  const dayStart = startOfTehranDay(now);

  if (period === 'DAILY') {
    return { start: dayStart, end: new Date(dayStart.getTime() + DAY_MS) };
  }

  if (period === 'WEEKLY') {
    const daysSinceSaturday = (new Date(dayStart.getTime() + TEHRAN_OFFSET_MS).getUTCDay() + 1) % 7;
    const start = new Date(dayStart.getTime() - daysSinceSaturday * DAY_MS);

    return { start, end: new Date(start.getTime() + 7 * DAY_MS) };
  }

  if (period === 'MONTHLY') {
    const { year, month } = jalaliPartsOf(now);

    return jalaliMonthBounds(year, month);
  }

  return { start: null, end: new Date(now.getTime() + 1) };
};

export type ReportData = {
  calls: { id: string; adminId: string | null; kind: string | null; isAnswered: boolean | null; startedAt: string | null }[];
  followups: {
    adminId: string | null;
    status: string | null;
    addedAt: string | null;
    closedAt: string | null;
    failureReason: { title: string | null } | null;
  }[];
  commissions: { adminId: string | null; amountUsdt: number | null; commissionUsdt: number | null; purchasedAt: string | null }[];
  activations: { adminId: string | null; status: string | null; createdAt: string | null; usedAt: string | null }[];
  touches: { adminId: string | null; status: string | null; windowEndAt: string | null }[];
  freezes: { adminId: string | null; frozenAt: string | null; unfrozenAt: string | null }[];
  callReasons: { callId: string | null; feedbackReason: { title: string | null } | null }[];
};

type CallCounts = { total: number; answered: number; notAnswered: number; answerRate: number | null };

export type Report = {
  calls: { followup: CallCounts; retention: CallCounts };
  cases: { added: number; outcomes: Record<string, number>; failedByReason: Record<string, number> };
  conversionRate: number | null;
  revenueUsdt: number;
  commissionUsdt: number;
  codes: { activated: number; used: number };
  schedule: { dueTouches: number; onTime: number; onTimeRate: number | null; redCalls: number };
  topReasons: { title: string; count: number }[];
  workingDays: number | null;
  frozenDays: number | null;
};

const ACTIVATED_STATUSES = ['ACTIVE', 'USED', 'EXPIRED', 'DEACTIVATED'];
const TOP_REASON_COUNT = 5;

const rate = (part: number, whole: number) => (whole === 0 ? null : Math.round((part / whole) * 1000) / 10);
const round1 = (value: number) => Math.round(value * 10) / 10;

const callCounts = (calls: { isAnswered: boolean | null }[]): CallCounts => {
  const answered = calls.filter(({ isAnswered }) => isAnswered).length;

  return { total: calls.length, answered, notAnswered: calls.length - answered, answerRate: rate(answered, calls.length) };
};

// Every event counts on its own date. adminId null means the whole team.
export const buildReport = ({
  data,
  adminId,
  range,
  now,
}: {
  data: ReportData;
  adminId: string | null;
  range: ReportRange;
  now: Date;
}): Report => {
  const inRange = (iso: string | null) =>
    iso !== null && (range.start === null || new Date(iso) >= range.start) && new Date(iso) < range.end;
  const mine = <TRow extends { adminId: string | null }>(rows: TRow[]) =>
    rows.filter((row) => adminId === null || row.adminId === adminId);

  const calls = mine(data.calls).filter(({ startedAt }) => inRange(startedAt));
  const added = mine(data.followups).filter(({ addedAt }) => inRange(addedAt));
  const closed = mine(data.followups).filter(({ closedAt }) => inRange(closedAt));
  const outcomes: Record<string, number> = {};
  const failedByReason: Record<string, number> = {};

  for (const { status, failureReason } of closed) {
    outcomes[status ?? 'UNKNOWN'] = (outcomes[status ?? 'UNKNOWN'] ?? 0) + 1;

    if (status === 'FAILED') {
      const title = failureReason?.title ?? 'Unknown';

      failedByReason[title] = (failedByReason[title] ?? 0) + 1;
    }
  }

  // A purchase before any call is in neither side of the conversion rate.
  const countedClosed = closed.filter(({ status }) => status !== 'PURCHASE_BEFORE_CALL');
  const commissions = mine(data.commissions).filter(({ purchasedAt }) => inRange(purchasedAt));
  const activations = mine(data.activations);
  const touches = mine(data.touches).filter(
    ({ status, windowEndAt }) => inRange(windowEndAt) && (status === 'DONE' || status === 'MISSED'),
  );
  const onTime = touches.filter(({ status }) => status === 'DONE').length;
  const callIds = new Set(calls.map(({ id }) => id));
  const reasonCounts: Record<string, number> = {};

  for (const { callId, feedbackReason } of data.callReasons) {
    if (callId && callIds.has(callId) && feedbackReason?.title) {
      reasonCounts[feedbackReason.title] = (reasonCounts[feedbackReason.title] ?? 0) + 1;
    }
  }

  // Freeze time leaves the working days. Only a bounded period for one Agent has them.
  let workingDays: number | null = null;
  let frozenDays: number | null = null;

  if (adminId !== null && range.start !== null) {
    const periodEnd = Math.min(range.end.getTime(), now.getTime());
    const elapsed = Math.max(0, periodEnd - range.start.getTime());
    const frozen = data.freezes
      .filter((freeze) => freeze.adminId === adminId && freeze.frozenAt)
      .reduce((sum, { frozenAt, unfrozenAt }) => {
        const from = Math.max(new Date(frozenAt as string).getTime(), range.start!.getTime());
        const to = Math.min(unfrozenAt ? new Date(unfrozenAt).getTime() : now.getTime(), periodEnd);

        return sum + Math.max(0, to - from);
      }, 0);

    frozenDays = round1(frozen / DAY_MS);
    workingDays = round1((elapsed - frozen) / DAY_MS);
  }

  return {
    calls: {
      followup: callCounts(calls.filter(({ kind }) => kind === 'FOLLOWUP')),
      retention: callCounts(calls.filter(({ kind }) => kind === 'RETENTION')),
    },
    cases: { added: added.length, outcomes, failedByReason },
    conversionRate: rate(countedClosed.filter(({ status }) => status === 'SUCCESSFUL').length, countedClosed.length),
    revenueUsdt: fromMicros(commissions.reduce((sum, { amountUsdt }) => sum + toMicros(amountUsdt), 0)),
    commissionUsdt: fromMicros(commissions.reduce((sum, { commissionUsdt }) => sum + toMicros(commissionUsdt), 0)),
    codes: {
      activated: activations.filter(({ status, createdAt }) => ACTIVATED_STATUSES.includes(status ?? '') && inRange(createdAt)).length,
      used: activations.filter(({ status, usedAt }) => status === 'USED' && inRange(usedAt)).length,
    },
    schedule: { dueTouches: touches.length, onTime, onTimeRate: rate(onTime, touches.length), redCalls: touches.length - onTime },
    topReasons: Object.entries(reasonCounts)
      .map(([title, count]) => ({ title, count }))
      .sort((left, right) => right.count - left.count || left.title.localeCompare(right.title))
      .slice(0, TOP_REASON_COUNT),
    workingDays,
    frozenDays,
  };
};
