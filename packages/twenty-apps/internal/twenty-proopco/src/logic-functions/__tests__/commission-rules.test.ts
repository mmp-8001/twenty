import { describe, expect, it } from 'vitest';

import {
  computeCommissionMicros,
  countWholeDays,
  findCommissionTier,
  monthBounds,
  previousMonthOf,
} from 'src/logic-functions/utils/commission-rules.util';

const tiers = [
  { name: 'early', minDay: 0, maxDay: 7, rate: 0.1 },
  { name: 'late', minDay: 8, maxDay: 14, rate: 0.05 },
];

describe('commission rules', () => {
  it.each([
    [0, 'early'],
    [7, 'early'],
    [8, 'late'],
    [14, 'late'],
  ])('picks the tier for day %i', (days, name) => {
    expect(findCommissionTier(tiers, days)?.name).toBe(name);
  });

  it.each([-1, 15])('finds no tier for day %i', (days) => {
    expect(findCommissionTier(tiers, days)).toBeUndefined();
  });

  it('counts whole days between two instants', () => {
    expect(countWholeDays('2026-03-01T12:00:00Z', '2026-03-08T11:59:59Z')).toBe(6);
    expect(countWholeDays('2026-03-01T12:00:00Z', '2026-03-08T12:00:00Z')).toBe(7);
  });

  it('keeps money in whole micros', () => {
    expect(computeCommissionMicros(100_000_000, 0.07)).toBe(7_000_000);
    expect(computeCommissionMicros(33_333_333, 0.1)).toBe(3_333_333);
  });

  it('finds the previous month across a year boundary', () => {
    expect(previousMonthOf(new Date('2026-01-01T03:00:00Z'))).toBe('2025-12');
    expect(previousMonthOf(new Date('2026-03-01T03:00:00Z'))).toBe('2026-02');
  });

  it('bounds a month in UTC', () => {
    expect(monthBounds('2025-12')).toEqual({
      start: '2025-12-01T00:00:00.000Z',
      end: '2026-01-01T00:00:00.000Z',
    });
  });
});
