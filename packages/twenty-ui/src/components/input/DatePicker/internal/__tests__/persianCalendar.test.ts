import {
  addPersianMonths,
  getPersianDateParts,
  getPersianKeyboardTarget,
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

describe('getPersianKeyboardTarget', () => {
  const base = { shiftKey: false, weekStart: 6 };

  it.each([
    ['ArrowRight', '2026-11-04'],
    ['ArrowLeft', '2026-11-02'],
    ['ArrowDown', '2026-11-10'],
    ['ArrowUp', '2026-10-27'],
    ['PageDown', '2026-12-03'],
    ['PageUp', '2026-10-04'],
    ['Home', '2026-10-31'],
    ['End', '2026-11-06'],
  ])('%s from 2026-11-03', (key, expected) => {
    expect(
      getPersianKeyboardTarget({ ...base, isoDate: '2026-11-03', key }),
    ).toBe(expected);
  });

  it('moves a year with Shift+PageDown and clamps the day', () => {
    // 30 Esfand 1403 (leap) -> 29 Esfand 1404
    expect(
      getPersianKeyboardTarget({
        isoDate: persianDateToIso({ year: 1403, month: 12, day: 30 }),
        key: 'PageDown',
        shiftKey: true,
        weekStart: 6,
      }),
    ).toBe(persianDateToIso({ year: 1404, month: 12, day: 29 }));
  });

  it('ignores other keys', () => {
    expect(
      getPersianKeyboardTarget({ ...base, isoDate: '2026-11-03', key: 'a' }),
    ).toBeNull();
  });
});
