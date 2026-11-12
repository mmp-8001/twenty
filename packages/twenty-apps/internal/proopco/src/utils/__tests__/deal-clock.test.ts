import { describe, expect, it } from 'vitest';

import { DAY_MS, HOUR_MS } from 'src/constants/time.constant';
import {
  applyCall,
  buildSlotWindows,
  defaultNextCallAt,
  planProgressOf,
  requiresOutsidePlanReason,
  slotsEndingBefore,
  urgencyOf,
  type DealClock,
} from 'src/utils/deal-clock.util';

const START = new Date('2026-11-12T07:00:00Z');
const at = (days: number, hours = 0) =>
  new Date(START.getTime() + days * DAY_MS + hours * HOUR_MS);

const awaiting: DealClock = {
  stage: 'AWAITING_FIRST_CALL',
  openedAt: START,
  firstAnsweredCallAt: null,
  frozenMs: 0,
  deadlineAt: at(7),
  slots: ['PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING'],
};

const followUp: DealClock = {
  ...awaiting,
  stage: 'IN_FOLLOW_UP',
  firstAnsweredCallAt: START,
  deadlineAt: at(30),
  slots: ['DONE', 'PENDING', 'PENDING', 'PENDING', 'PENDING'],
};

describe('buildSlotWindows', () => {
  it('lays slots on elapsed days and cuts them at the deadline', () => {
    const windows = buildSlotWindows(START, at(30));

    expect(windows.map(({ slot, startsAt }) => [slot, (startsAt.getTime() - START.getTime()) / DAY_MS])).toEqual([
      [1, 0], [2, 1], [3, 4], [4, 8], [5, 16],
    ]);
    expect(windows[4].endsAt).toEqual(at(30));
    expect(buildSlotWindows(START, at(6)).map(({ slot }) => slot)).toEqual([1, 2, 3]);
    expect(buildSlotWindows(START, at(6))[2].endsAt).toEqual(at(6));
  });
});

describe('applyCall', () => {
  it('starts the follow-up on the first answered call', () => {
    const { clock, slotNumber, completedSlot } = applyCall(awaiting, { now: at(2), answered: true });

    expect(clock.stage).toBe('IN_FOLLOW_UP');
    expect(clock.firstAnsweredCallAt).toEqual(at(2));
    expect(clock.deadlineAt).toEqual(at(32));
    expect(clock.slots[0]).toBe('DONE');
    expect([slotNumber, completedSlot]).toEqual([1, 1]);
  });

  it('keeps an unanswered awaiting call out of the slots', () => {
    const { clock, slotNumber } = applyCall(awaiting, { now: at(2), answered: false });

    expect(clock).toBe(awaiting);
    expect(slotNumber).toBeNull();
  });

  it('completes only the slot the answered call falls in (QS2)', () => {
    const { clock, completedSlot } = applyCall(followUp, { now: at(10), answered: true });

    expect(completedSlot).toBe(4);
    expect(clock.slots).toEqual(['DONE', 'PENDING', 'PENDING', 'DONE', 'PENDING']);
  });

  it('leaves the slot pending on an unanswered call (QS1)', () => {
    const { clock, slotNumber, completedSlot } = applyCall(followUp, { now: at(5), answered: false });

    expect([slotNumber, completedSlot]).toEqual([3, null]);
    expect(clock.slots[2]).toBe('PENDING');
  });
});

describe('defaultNextCallAt', () => {
  it('suggests the next pending window start for an answered call', () => {
    const { clock } = applyCall(followUp, { now: at(2), answered: true });

    expect(defaultNextCallAt({ now: at(2), answered: true, clock })).toEqual(at(4));
  });

  it('falls back to one hour when the next window has begun', () => {
    const { clock } = applyCall(followUp, { now: at(5), answered: true });

    expect(clock.slots[2]).toBe('DONE');
    expect(defaultNextCallAt({ now: at(5), answered: true, clock })).toEqual(at(8));
  });

  it('keeps an unanswered call inside its window (QS1)', () => {
    const { clock } = applyCall(followUp, { now: at(5), answered: false });

    expect(defaultNextCallAt({ now: at(5), answered: false, clock })).toEqual(at(6));
    expect(defaultNextCallAt({ now: at(7, 12), answered: false, clock })).toEqual(at(7, 14));
    expect(defaultNextCallAt({ now: at(7, 23), answered: false, clock })).toEqual(at(8));
  });

  it('uses a day for awaiting and retention, and nothing for answered retention', () => {
    expect(defaultNextCallAt({ now: at(1), answered: false, clock: awaiting })).toEqual(at(2));
    expect(defaultNextCallAt({ now: at(1), answered: false, clock: null })).toEqual(at(2));
    expect(defaultNextCallAt({ now: at(1), answered: true, clock: null })).toBeNull();
  });

  it('never goes past the deadline (QS5)', () => {
    expect(defaultNextCallAt({ now: at(29, 23), answered: false, clock: followUp })).toEqual(at(30));
  });
});

describe('outside plan', () => {
  it('needs a reason once the next pending window has ended (QS2)', () => {
    const { clock } = applyCall(followUp, { now: at(2), answered: true });

    expect(requiresOutsidePlanReason(clock, at(2), at(7, 23))).toBe(false);
    expect(requiresOutsidePlanReason(clock, at(2), at(10))).toBe(true);
    expect(slotsEndingBefore(clock, at(2), at(10))).toEqual([3]);
  });

  it('never needs one without a plan', () => {
    expect(requiresOutsidePlanReason(null, at(1), at(20))).toBe(false);
    expect(requiresOutsidePlanReason(awaiting, at(1), at(6))).toBe(false);
  });
});

describe('urgencyOf', () => {
  const now = new Date('2026-11-12T10:00:00Z');

  it.each([
    [null, null],
    ['2026-11-12T12:00:00Z', 'TODAY'],
    ['2026-11-13T12:00:00Z', 'LATER'],
    ['2026-11-12T09:00:00Z', 'DUE'],
    ['2026-11-12T07:30:00Z', 'OVERDUE'],
    ['2026-11-11T22:00:00Z', 'OVERDUE'],
  ])('maps %s to %s', (nextCallAt, expected) => {
    expect(urgencyOf(nextCallAt === null ? null : new Date(nextCallAt), now)).toBe(expected);
  });
});

describe('planProgressOf', () => {
  it('counts days and slots', () => {
    expect(planProgressOf(awaiting, at(1, 3))).toBe('روز ۲ از ۷');
    expect(planProgressOf(followUp, at(5))).toBe('نوبت ۳ از ۵ · روز ۶ از ۳۰');
  });
});
