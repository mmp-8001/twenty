import { describe, expect, it } from 'vitest';

import {
  daysFrozen,
  deadlineAfterRemaining,
  remainingSecondsUntil,
  shiftWindow,
} from 'src/utils/freeze-time.util';

const NOW = new Date('2026-03-10T10:00:00Z');

describe('freeze time', () => {
  it('keeps what is left of a deadline and never goes negative', () => {
    expect(remainingSecondsUntil(new Date('2026-03-10T11:00:00Z'), NOW)).toBe(3600);
    expect(remainingSecondsUntil(new Date('2026-03-10T09:00:00Z'), NOW)).toBe(0);
  });

  it('restores a deadline from the remaining seconds', () => {
    expect(deadlineAfterRemaining(3600, NOW).toISOString()).toBe('2026-03-10T11:00:00.000Z');
  });

  it('shifts a window by the frozen time', () => {
    const shifted = shiftWindow({
      windowStartAt: new Date('2026-03-11T00:00:00Z'),
      windowEndAt: new Date('2026-03-12T00:00:00Z'),
      shiftMs: 2 * 24 * 3600 * 1000,
    });

    expect(shifted.windowStartAt.toISOString()).toBe('2026-03-13T00:00:00.000Z');
    expect(shifted.windowEndAt.toISOString()).toBe('2026-03-14T00:00:00.000Z');
  });

  it('counts whole days frozen', () => {
    expect(daysFrozen(new Date('2026-03-03T09:00:00Z'), NOW)).toBe(7);
    expect(daysFrozen(new Date('2026-03-03T11:00:00Z'), NOW)).toBe(6);
  });
});
