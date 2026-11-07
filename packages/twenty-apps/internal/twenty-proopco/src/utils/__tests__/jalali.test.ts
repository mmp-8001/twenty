import { describe, expect, it } from 'vitest';

import {
  isFirstJalaliDay,
  jalaliMonthBounds,
  jalaliPartsOf,
  previousJalaliMonth,
} from 'src/utils/jalali.util';

describe('jalaliPartsOf', () => {
  it.each([
    ['2024-03-19T20:29:59Z', { year: 1402, month: 12, day: 29 }],
    ['2024-03-19T20:30:00Z', { year: 1403, month: 1, day: 1 }],
    ['2025-03-19T20:29:59Z', { year: 1403, month: 12, day: 29 }],
    ['2025-03-19T20:30:00Z', { year: 1403, month: 12, day: 30 }],
    ['2025-03-20T20:30:00Z', { year: 1404, month: 1, day: 1 }],
  ])('reads %s in Tehran time', (iso, expected) => {
    expect(jalaliPartsOf(new Date(iso))).toEqual(expected);
  });
});

describe('jalaliMonthBounds', () => {
  it.each([
    ['Farvardin 1403 (31 days)', 1403, 1, '2024-03-19T20:30:00.000Z', '2024-04-19T20:30:00.000Z'],
    ['Mehr 1403 (30 days)', 1403, 7, '2024-09-21T20:30:00.000Z', '2024-10-21T20:30:00.000Z'],
    ['Esfand 1402 (29 days)', 1402, 12, '2024-02-19T20:30:00.000Z', '2024-03-19T20:30:00.000Z'],
    ['Esfand 1403 (30 days, leap year)', 1403, 12, '2025-02-18T20:30:00.000Z', '2025-03-20T20:30:00.000Z'],
  ])('%s', (_label, year, month, start, end) => {
    const bounds = jalaliMonthBounds(year, month);

    expect(bounds.start.toISOString()).toBe(start);
    expect(bounds.end.toISOString()).toBe(end);
  });

  it('chains months without gaps across the year change', () => {
    expect(jalaliMonthBounds(1402, 12).end.getTime()).toBe(jalaliMonthBounds(1403, 1).start.getTime());
  });
});

describe('previousJalaliMonth and isFirstJalaliDay', () => {
  it('rolls Farvardin back to the last Esfand', () => {
    expect(previousJalaliMonth(new Date('2024-03-19T20:30:00Z'))).toEqual({ year: 1402, month: 12 });
    expect(previousJalaliMonth(new Date('2024-11-22T10:00:00Z'))).toEqual({ year: 1403, month: 8 });
  });

  it('flips to the first day at 00:00 Tehran, which is 20:30 UTC', () => {
    expect(isFirstJalaliDay(new Date('2024-09-21T20:29:59Z'))).toBe(false);
    expect(isFirstJalaliDay(new Date('2024-09-21T20:30:00Z'))).toBe(true);
    expect(isFirstJalaliDay(new Date('2024-09-22T20:29:59Z'))).toBe(true);
  });
});
