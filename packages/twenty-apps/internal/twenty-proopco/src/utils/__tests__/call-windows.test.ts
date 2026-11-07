import { describe, expect, it } from 'vitest';

import {
  buildTouchWindows,
  defaultNextCallAt,
  findTouchNoAt,
  isOutsideSuggestedWindow,
  planTouchChanges,
  startOfTehranDay,
  suggestTouchNo,
} from 'src/utils/call-windows.util';

// 2026-01-10 12:00 Tehran is 08:30 UTC; Tehran midnight that day is 2026-01-09T20:30Z.
const FIRST_CALL = new Date('2026-01-10T08:30:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const tehranDay = (dayOffset: number, hour = 12) =>
  new Date(Date.parse('2026-01-09T20:30:00Z') + dayOffset * DAY_MS + hour * 3_600_000);

describe('startOfTehranDay', () => {
  it('rolls over at 20:30 UTC, not at UTC midnight', () => {
    expect(startOfTehranDay(new Date('2026-01-10T20:29:59Z')).toISOString()).toBe('2026-01-09T20:30:00.000Z');
    expect(startOfTehranDay(new Date('2026-01-10T20:30:00Z')).toISOString()).toBe('2026-01-10T20:30:00.000Z');
  });
});

describe('buildTouchWindows', () => {
  const windows = buildTouchWindows(FIRST_CALL);

  it('builds five windows over days 0, 1-3, 4-7, 8-15 and 16-30', () => {
    expect(windows.map(({ touchNo }) => touchNo)).toEqual([1, 2, 3, 4, 5]);
    expect(windows[0].windowStartAt).toEqual(FIRST_CALL);
    expect(windows[1].windowStartAt).toEqual(tehranDay(1, 0));
    expect(windows[1].windowEndAt).toEqual(tehranDay(4, 0));
    expect(windows[2].windowEndAt).toEqual(tehranDay(8, 0));
    expect(windows[3].windowEndAt).toEqual(tehranDay(16, 0));
  });

  it('ends the last window at the 30-day deadline', () => {
    expect(windows[4].windowEndAt).toEqual(new Date(FIRST_CALL.getTime() + 30 * DAY_MS));
  });

  it.each([
    [tehranDay(0, 23), 1],
    [tehranDay(1, 0), 2],
    [tehranDay(3, 23), 2],
    [tehranDay(4, 0), 3],
    [tehranDay(15, 23), 4],
    [tehranDay(16, 0), 5],
    [new Date(FIRST_CALL.getTime() + 30 * DAY_MS - 1), 5],
    [new Date(FIRST_CALL.getTime() + 30 * DAY_MS), null],
    [new Date(FIRST_CALL.getTime() - 1), null],
  ])('puts %s in window %s (start inclusive, end exclusive)', (at, expected) => {
    expect(findTouchNoAt(windows, at)).toBe(expected);
  });
});

describe('next call suggestion', () => {
  const windows = buildTouchWindows(FIRST_CALL);

  it('stays in the same window after an unanswered call and moves on after an answered one', () => {
    const day5 = tehranDay(5);

    expect(suggestTouchNo({ windows, now: day5, isAnswered: false })).toBe(3);
    expect(suggestTouchNo({ windows, now: day5, isAnswered: true })).toBe(4);
    expect(suggestTouchNo({ windows, now: tehranDay(20), isAnswered: true })).toBeNull();
  });

  it('defaults an unanswered call on day 5 to day 6 (QS1)', () => {
    const next = defaultNextCallAt({ windows, suggestedTouchNo: 3, now: tehranDay(5) });

    expect(next).toEqual(tehranDay(6));
  });

  it('holds the default inside the window on its last day', () => {
    const next = defaultNextCallAt({ windows, suggestedTouchNo: 3, now: tehranDay(7, 20) });

    expect(findTouchNoAt(windows, next!)).toBe(3);
  });

  it('defaults an answered call to 10:00 of the next window first day', () => {
    expect(defaultNextCallAt({ windows, suggestedTouchNo: 4, now: tehranDay(5) })).toEqual(tehranDay(8, 10));
  });

  it('asks for an off-schedule reason only outside the suggested window (QS2)', () => {
    const day2 = tehranDay(2);
    const suggestedTouchNo = suggestTouchNo({ windows, now: day2, isAnswered: true });

    expect(suggestedTouchNo).toBe(3);
    expect(isOutsideSuggestedWindow({ windows, suggestedTouchNo, nextCallAt: tehranDay(10) })).toBe(true);
    expect(isOutsideSuggestedWindow({ windows, suggestedTouchNo, nextCallAt: tehranDay(5) })).toBe(false);
    expect(isOutsideSuggestedWindow({ windows, suggestedTouchNo: null, nextCallAt: tehranDay(10) })).toBe(false);
  });
});

describe('planTouchChanges', () => {
  const touches = buildTouchWindows(FIRST_CALL).map((window) => ({
    ...window,
    status: window.touchNo === 1 ? 'DONE' : 'OPEN',
  }));

  it('completes the window an answered call falls in', () => {
    expect(
      planTouchChanges({ touches, now: tehranDay(5), isAnswered: true, suggestedTouchNo: 4, offScheduleReason: null, nextCallAt: tehranDay(9) }),
    ).toEqual([{ touchNo: 3, status: 'DONE' }]);
  });

  it('does not complete anything on an unanswered call (QS1)', () => {
    expect(
      planTouchChanges({ touches, now: tehranDay(5), isAnswered: false, suggestedTouchNo: 3, offScheduleReason: null, nextCallAt: tehranDay(6) }),
    ).toEqual([]);
  });

  it('defers the skipped window on a user request and completes window 4 on day 10 (QS2)', () => {
    const afterDay2Call = planTouchChanges({
      touches,
      now: tehranDay(2),
      isAnswered: true,
      suggestedTouchNo: 3,
      offScheduleReason: 'USER_REQUEST',
      nextCallAt: tehranDay(10),
    });

    expect(afterDay2Call).toEqual([
      { touchNo: 2, status: 'DONE' },
      { touchNo: 3, status: 'DEFERRED_BY_USER' },
    ]);

    const deferred = touches.map((touch) => ({
      ...touch,
      status: afterDay2Call.find(({ touchNo }) => touchNo === touch.touchNo)?.status ?? touch.status,
    }));

    expect(
      planTouchChanges({ touches: deferred, now: tehranDay(10), isAnswered: true, suggestedTouchNo: 5, offScheduleReason: null, nextCallAt: tehranDay(17) }),
    ).toEqual([{ touchNo: 4, status: 'DONE' }]);
  });

  it('leaves the skipped window open on an agent decision so it counts as missed', () => {
    expect(
      planTouchChanges({ touches, now: tehranDay(2), isAnswered: true, suggestedTouchNo: 3, offScheduleReason: 'ADMIN_DECISION', nextCallAt: tehranDay(10) }),
    ).toEqual([{ touchNo: 2, status: 'DONE' }]);
  });
});
