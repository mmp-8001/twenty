import { DateFormat } from '@/localization/constants/DateFormat';
import { TimeFormat } from '@/localization/constants/TimeFormat';
import { formatDateISOStringToDate } from '@/localization/utils/formatDateISOStringToDate';
import { formatDateISOStringToDateTime } from '@/localization/utils/formatDateISOStringToDateTime';
import { enUS } from 'date-fns/locale';
import { WorkspaceMemberCalendarEnum } from '~/generated-metadata/graphql';

describe('Jalali date formatting', () => {
  it('formats the same plain date in both calendars', () => {
    const args = {
      date: '2026-11-03',
      timeZone: 'UTC',
      dateFormat: DateFormat.DAY_FIRST,
      localeCatalog: enUS,
    };

    expect(formatDateISOStringToDate(args)).toBe('3 Nov, 2026');
    expect(
      formatDateISOStringToDate({
        ...args,
        calendar: WorkspaceMemberCalendarEnum.JALALI,
      }),
    ).toBe('12 Aban, 1405');
  });

  it('keeps Gregorian output when the calendar is Gregorian', () => {
    expect(
      formatDateISOStringToDate({
        date: '2026-11-03',
        timeZone: 'UTC',
        dateFormat: DateFormat.MONTH_FIRST,
        localeCatalog: enUS,
        calendar: WorkspaceMemberCalendarEnum.GREGORIAN,
      }),
    ).toBe('Nov 3, 2026');
  });

  it('honors the date format order for Jalali', () => {
    const format = (dateFormat: DateFormat) =>
      formatDateISOStringToDate({
        date: '2026-11-03',
        timeZone: 'UTC',
        dateFormat,
        calendar: WorkspaceMemberCalendarEnum.JALALI,
      });

    expect(format(DateFormat.MONTH_FIRST)).toBe('Aban 12, 1405');
    expect(format(DateFormat.YEAR_FIRST)).toBe('1405 Aban 12');
  });

  it('applies the time zone to date-times so the Jalali day matches the same instant', () => {
    const args = {
      date: '2026-11-03T22:00:00.000Z',
      dateFormat: DateFormat.DAY_FIRST,
      timeFormat: TimeFormat.HOUR_24,
      localeCatalog: enUS,
      calendar: WorkspaceMemberCalendarEnum.JALALI,
    };

    expect(formatDateISOStringToDateTime({ ...args, timeZone: 'UTC' })).toBe(
      '12 Aban, 1405 22:00',
    );
    expect(
      formatDateISOStringToDateTime({ ...args, timeZone: 'Asia/Tehran' }),
    ).toBe('13 Aban, 1405 01:30');
  });
});
