import { DateFormat } from '@/localization/constants/DateFormat';
import { Temporal } from 'temporal-polyfill';

const pad = (value: number, length: number) =>
  value.toString().padStart(length, '0');

const getSeparator = (dateFormat: DateFormat) =>
  dateFormat === DateFormat.YEAR_FIRST ? '-' : '/';

// Typed text in the member's date-format order, read as a Jalali date.
export const parseJalaliInputStringToPlainDate = (
  input: string,
  dateFormat: DateFormat,
): Temporal.PlainDate | null => {
  const parts = input.split(getSeparator(dateFormat)).map(Number);

  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    return null;
  }

  const [year, month, day] =
    dateFormat === DateFormat.DAY_FIRST
      ? [parts[2], parts[1], parts[0]]
      : dateFormat === DateFormat.YEAR_FIRST
        ? parts
        : [parts[2], parts[0], parts[1]];

  try {
    return Temporal.PlainDate.from(
      { calendar: 'persian', year, month, day },
      { overflow: 'reject' },
    ).withCalendar('iso8601');
  } catch {
    return null;
  }
};

export const formatPlainDateToJalaliInputString = (
  plainDate: Temporal.PlainDate,
  dateFormat: DateFormat,
): string => {
  const { year, month, day } = plainDate.withCalendar('persian');
  const separator = getSeparator(dateFormat);
  const [yyyy, mm, dd] = [pad(year, 4), pad(month, 2), pad(day, 2)];

  switch (dateFormat) {
    case DateFormat.DAY_FIRST:
      return [dd, mm, yyyy].join(separator);
    case DateFormat.YEAR_FIRST:
      return [yyyy, mm, dd].join(separator);
    default:
      return [mm, dd, yyyy].join(separator);
  }
};

// Local-midnight Date for the same Gregorian day, matching what date-fns parse yields.
export const plainDateToLocalDate = (plainDate: Temporal.PlainDate) =>
  new Date(plainDate.year, plainDate.month - 1, plainDate.day);

export const localDateToPlainDate = (date: Date) =>
  Temporal.PlainDate.from({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
