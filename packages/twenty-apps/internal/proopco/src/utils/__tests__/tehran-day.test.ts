import { describe, expect, it } from 'vitest';

import { endOfTehranDay, startOfTehranDay } from 'src/utils/tehran-day.util';

describe('startOfTehranDay', () => {
  it.each([
    ['2026-11-14T20:29:59Z', '2026-11-13T20:30:00.000Z'],
    ['2026-11-14T20:30:00Z', '2026-11-14T20:30:00.000Z'],
    ['2026-11-14T00:00:00Z', '2026-11-13T20:30:00.000Z'],
  ])('maps %s to Tehran midnight', (iso, expected) => {
    expect(startOfTehranDay(new Date(iso)).toISOString()).toBe(expected);
  });

  it('ends the day 24h after it starts', () => {
    expect(endOfTehranDay(new Date('2026-11-14T10:00:00Z')).toISOString()).toBe(
      '2026-11-14T20:30:00.000Z',
    );
  });
});
