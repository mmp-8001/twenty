const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// shortcut: fixed +03:30, correct for Tehran since 2022; revisit if Iran reintroduces DST.
const TEHRAN_OFFSET_MS = 3.5 * HOUR_MS;

const FOLLOWUP_DAYS = 30;
const DEFAULT_CALL_HOUR_OFFSET_MS = 10 * HOUR_MS;

// LOGIC Q-01: day ranges counted in Tehran calendar days from the first answered call.
const TOUCH_DAY_RANGES = [
  [0, 0],
  [1, 3],
  [4, 7],
  [8, 15],
  [16, 30],
] as const;

export type TouchWindow = { touchNo: number; windowStartAt: Date; windowEndAt: Date };

export const startOfTehranDay = (at: Date): Date =>
  new Date(Math.floor((at.getTime() + TEHRAN_OFFSET_MS) / DAY_MS) * DAY_MS - TEHRAN_OFFSET_MS);

export const endOfTehranDay = (at: Date): Date =>
  new Date(startOfTehranDay(at).getTime() + DAY_MS);

// Start is inclusive and end exclusive. Window 1 starts at the call itself, window 5 ends at the 30-day deadline.
export const buildTouchWindows = (firstAnsweredCallAt: Date): TouchWindow[] => {
  const firstDayStart = startOfTehranDay(firstAnsweredCallAt).getTime();
  const deadline = firstAnsweredCallAt.getTime() + FOLLOWUP_DAYS * DAY_MS;

  return TOUCH_DAY_RANGES.map(([firstDay, lastDay], index) => ({
    touchNo: index + 1,
    windowStartAt: new Date(
      index === 0 ? firstAnsweredCallAt.getTime() : firstDayStart + firstDay * DAY_MS,
    ),
    windowEndAt: new Date(Math.min(firstDayStart + (lastDay + 1) * DAY_MS, deadline)),
  }));
};

export const findTouchNoAt = (windows: TouchWindow[], at: Date): number | null =>
  windows.find(
    ({ windowStartAt, windowEndAt }) => windowStartAt <= at && at < windowEndAt,
  )?.touchNo ?? null;

// Q-02: an answered call moves on to the next window, an unanswered one stays in the same window.
export const suggestTouchNo = ({
  windows,
  now,
  isAnswered,
}: {
  windows: TouchWindow[];
  now: Date;
  isAnswered: boolean;
}): number | null => {
  const currentTouchNo = findTouchNoAt(windows, now);

  if (currentTouchNo === null) {
    return null;
  }

  const suggested = isAnswered ? currentTouchNo + 1 : currentTouchNo;

  return suggested <= windows.length ? suggested : null;
};

export const isOutsideSuggestedWindow = ({
  windows,
  suggestedTouchNo,
  nextCallAt,
}: {
  windows: TouchWindow[];
  suggestedTouchNo: number | null;
  nextCallAt: Date;
}): boolean => {
  const suggested = windows.find(({ touchNo }) => touchNo === suggestedTouchNo);

  return suggested
    ? nextCallAt < suggested.windowStartAt || nextCallAt >= suggested.windowEndAt
    : false;
};

// Same window after an unanswered call: tomorrow, held inside the window. Next window: 10:00 Tehran of its first day.
export const defaultNextCallAt = ({
  windows,
  suggestedTouchNo,
  now,
}: {
  windows: TouchWindow[];
  suggestedTouchNo: number | null;
  now: Date;
}): Date | null => {
  const suggested = windows.find(({ touchNo }) => touchNo === suggestedTouchNo);

  if (!suggested) {
    return null;
  }

  const latest = suggested.windowEndAt.getTime() - 1;
  const target =
    suggested.windowStartAt > now
      ? startOfTehranDay(suggested.windowStartAt).getTime() + DEFAULT_CALL_HOUR_OFFSET_MS
      : now.getTime() + DAY_MS;

  return new Date(Math.min(Math.max(target, suggested.windowStartAt.getTime()), latest));
};

export type TouchState = TouchWindow & { status: string };

// Q-02 and Q-03: an answered call completes the window it falls in; a user-requested jump past windows defers them.
// An admin-decided jump changes nothing here, the sweep marks those windows missed when they end.
export const planTouchChanges = ({
  touches,
  now,
  isAnswered,
  suggestedTouchNo,
  offScheduleReason,
  nextCallAt,
}: {
  touches: TouchState[];
  now: Date;
  isAnswered: boolean;
  suggestedTouchNo: number | null;
  offScheduleReason: string | null;
  nextCallAt: Date | null;
}): { touchNo: number; status: 'DONE' | 'DEFERRED_BY_USER' }[] => {
  const changes: { touchNo: number; status: 'DONE' | 'DEFERRED_BY_USER' }[] = [];
  const completedTouchNo = isAnswered
    ? touches.find(
        ({ windowStartAt, windowEndAt, status }) =>
          windowStartAt <= now && now < windowEndAt && ['OPEN', 'DEFERRED_BY_USER'].includes(status),
      )?.touchNo
    : undefined;

  if (completedTouchNo !== undefined) {
    changes.push({ touchNo: completedTouchNo, status: 'DONE' });
  }

  if (offScheduleReason === 'USER_REQUEST' && nextCallAt && suggestedTouchNo !== null) {
    for (const { touchNo, windowEndAt, status } of touches) {
      if (
        touchNo >= suggestedTouchNo &&
        touchNo !== completedTouchNo &&
        status === 'OPEN' &&
        windowEndAt <= nextCallAt
      ) {
        changes.push({ touchNo, status: 'DEFERRED_BY_USER' });
      }
    }
  }

  return changes;
};
