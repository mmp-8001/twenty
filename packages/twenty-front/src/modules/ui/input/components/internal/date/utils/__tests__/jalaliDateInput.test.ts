import { DateFormat } from '@/localization/constants/DateFormat';
import {
  formatPlainDateToJalaliInputString,
  parseJalaliInputStringToPlainDate,
} from '@/ui/input/components/internal/date/utils/jalaliDateInput';
import { Temporal } from 'temporal-polyfill';

describe('jalaliDateInput', () => {
  it.each([
    [DateFormat.YEAR_FIRST, '1405-08-12'],
    [DateFormat.DAY_FIRST, '12/08/1405'],
    [DateFormat.MONTH_FIRST, '08/12/1405'],
  ])('round trips the same Gregorian day for %s', (dateFormat, typed) => {
    const plainDate = parseJalaliInputStringToPlainDate(typed, dateFormat);

    expect(plainDate?.toString()).toBe('2026-11-03');
    expect(
      formatPlainDateToJalaliInputString(
        Temporal.PlainDate.from('2026-11-03'),
        dateFormat,
      ),
    ).toBe(typed);
  });

  it('rejects a day that does not exist in the Jalali month', () => {
    expect(
      parseJalaliInputStringToPlainDate('1405-06-31', DateFormat.YEAR_FIRST),
    ).not.toBeNull();
    expect(
      parseJalaliInputStringToPlainDate('1405-07-31', DateFormat.YEAR_FIRST),
    ).toBeNull();
  });
});
