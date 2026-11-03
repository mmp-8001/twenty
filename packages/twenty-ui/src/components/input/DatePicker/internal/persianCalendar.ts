export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
export const GREGORIAN_TO_PERSIAN_YEAR_OFFSET = 621;
const AVERAGE_DAYS_PER_PERSIAN_MONTH = 30.44;

export type PersianDateParts = { year: number; month: number; day: number };
export type PersianYearMonth = Pick<PersianDateParts, 'year' | 'month'>;

const persianPartsFormatter = new Intl.DateTimeFormat('en-u-nu-latn', {
  calendar: 'persian',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  timeZone: 'UTC',
});

const getPersianPartsOfTimestamp = (timestamp: number): PersianDateParts => {
  const parts = persianPartsFormatter.formatToParts(new Date(timestamp));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return { year: read('year'), month: read('month'), day: read('day') };
};

const comparePersianParts = (left: PersianDateParts, right: PersianDateParts) =>
  left.year - right.year || left.month - right.month || left.day - right.day;

const toTimestamp = (isoDate: string) => Date.parse(`${isoDate}T00:00:00Z`);

export const getPersianDateParts = (isoDate: string): PersianDateParts =>
  getPersianPartsOfTimestamp(toTimestamp(isoDate));

// Intl only converts Gregorian to Persian, so start from an estimate and step to the exact day.
export const persianDateToIso = ({
  year,
  month,
  day,
}: PersianDateParts): string => {
  let timestamp =
    Date.UTC(year + GREGORIAN_TO_PERSIAN_YEAR_OFFSET, 2, 21) +
    Math.round((month - 1) * AVERAGE_DAYS_PER_PERSIAN_MONTH + day - 1) *
      MILLISECONDS_PER_DAY;
  const target = { year, month, day };

  for (let guard = 0; guard < 10; guard++) {
    const comparison = comparePersianParts(
      getPersianPartsOfTimestamp(timestamp),
      target,
    );

    if (comparison === 0) {
      break;
    }

    timestamp -= Math.sign(comparison) * MILLISECONDS_PER_DAY;
  }

  return new Date(timestamp).toISOString().slice(0, 10);
};

export const getPersianMonthLength = (year: number, month: number): number => {
  const nextMonth: PersianDateParts =
    month === 12
      ? { year: year + 1, month: 1, day: 1 }
      : { year, month: month + 1, day: 1 };

  return Math.round(
    (toTimestamp(persianDateToIso(nextMonth)) -
      toTimestamp(persianDateToIso({ year, month, day: 1 }))) /
      MILLISECONDS_PER_DAY,
  );
};

export const addPersianMonths = (
  { year, month }: PersianYearMonth,
  months: number,
): PersianYearMonth => {
  const index = year * 12 + (month - 1) + months;

  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
};

export const formatPersianYearMonth = ({ year, month }: PersianYearMonth) =>
  `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;

const addIsoDays = (isoDate: string, days: number) =>
  new Date(toTimestamp(isoDate) + days * MILLISECONDS_PER_DAY)
    .toISOString()
    .slice(0, 10);

// Mirrors react-datepicker's day keys; month and year steps clamp the day like date-fns.
export const getPersianKeyboardTarget = ({
  isoDate,
  key,
  shiftKey,
  weekStart,
}: {
  isoDate: string;
  key: string;
  shiftKey: boolean;
  weekStart: number;
}): string | null => {
  const dayOfWeek = new Date(toTimestamp(isoDate)).getUTCDay();
  const dayOffsets: Record<string, number> = {
    ArrowRight: 1,
    ArrowLeft: -1,
    ArrowDown: 7,
    ArrowUp: -7,
    Home: -((dayOfWeek - weekStart + 7) % 7),
    End: 6 - ((dayOfWeek - weekStart + 7) % 7),
  };

  const dayOffset = dayOffsets[key];

  if (dayOffset !== undefined) {
    return addIsoDays(isoDate, dayOffset);
  }

  if (key !== 'PageUp' && key !== 'PageDown') {
    return null;
  }

  const direction = key === 'PageUp' ? -1 : 1;
  const { year, month, day } = getPersianDateParts(isoDate);
  const target = addPersianMonths(
    { year, month },
    direction * (shiftKey ? 12 : 1),
  );

  return persianDateToIso({
    ...target,
    day: Math.min(day, getPersianMonthLength(target.year, target.month)),
  });
};
