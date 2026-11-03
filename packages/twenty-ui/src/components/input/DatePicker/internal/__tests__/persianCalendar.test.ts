import {
  addPersianMonths,
  getPersianDateParts,
  getPersianMonthLength,
  persianDateToIso,
} from '../persianCalendar';

describe('persianCalendar', () => {
  it('converts Gregorian to Jalali and back to the same ISO date', () => {
    expect(getPersianDateParts('2026-11-03')).toEqual({
      year: 1405,
      month: 8,
      day: 12,
    });
    expect(persianDateToIso({ year: 1405, month: 8, day: 12 })).toBe(
      '2026-11-03',
    );
  });

  it.each([
    '2026-03-20',
    '2026-03-21',
    '2025-03-20',
    '2030-12-31',
    '1999-01-01',
  ])('round-trips %s', (isoDate) => {
    expect(persianDateToIso(getPersianDateParts(isoDate))).toBe(isoDate);
  });

  it('knows Jalali month lengths including the leap Esfand', () => {
    expect(getPersianMonthLength(1405, 1)).toBe(31);
    expect(getPersianMonthLength(1405, 7)).toBe(30);
    expect(getPersianMonthLength(1403, 12)).toBe(30);
    expect(getPersianMonthLength(1405, 12)).toBe(29);
  });

  it('steps months across year boundaries', () => {
    expect(addPersianMonths({ year: 1405, month: 12 }, 1)).toEqual({
      year: 1406,
      month: 1,
    });
    expect(addPersianMonths({ year: 1405, month: 1 }, -1)).toEqual({
      year: 1404,
      month: 12,
    });
  });
});
