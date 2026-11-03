const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const FIRST_DAY_OF_YEAR_OFFSET_FROM_GREGORIAN = 621;
const AVERAGE_DAYS_PER_PERSIAN_MONTH = 30.44;

export type PersianDateParts = { year: number; month: number; day: number };

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

const comparePersianParts = (a: PersianDateParts, b: PersianDateParts) =>
  a.year - b.year || a.month - b.month || a.day - b.day;

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
    Date.UTC(year + FIRST_DAY_OF_YEAR_OFFSET_FROM_GREGORIAN, 2, 21) +
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
  const nextMonth =
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
  { year, month }: { year: number; month: number },
  months: number,
) => {
  const index = year * 12 + (month - 1) + months;

  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
};

export const formatPersianYearMonth = ({
  year,
  month,
}: {
  year: number;
  month: number;
}) =>
  `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
