import { DAY_MS, TEHRAN_OFFSET_MS } from 'src/constants/time.constant';
import { startOfTehranDay } from 'src/utils/tehran-day.util';

const jalaliFormat = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

export type JalaliParts = { year: number; month: number; day: number };

type JalaliMonth = Pick<JalaliParts, 'year' | 'month'>;

export const jalaliPartsOf = (at: Date): JalaliParts => {
  const parts = jalaliFormat.formatToParts(
    new Date(at.getTime() + TEHRAN_OFFSET_MS),
  );
  const read = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  return { year: read('year'), month: read('month'), day: read('day') };
};

const monthIndex = ({ year, month }: JalaliMonth) => year * 12 + month;

// Tehran midnight of the month's first day, as a UTC instant.
export const jalaliMonthStart = (year: number, month: number): Date => {
  // The guess lands within a month of the target; walking day by day settles it.
  let probe = new Date(
    Date.UTC(year + 621, 2, 21) + (month - 1) * 30 * DAY_MS,
  );

  while (monthIndex(jalaliPartsOf(probe)) < monthIndex({ year, month })) {
    probe = new Date(probe.getTime() + DAY_MS);
  }

  while (monthIndex(jalaliPartsOf(probe)) > monthIndex({ year, month })) {
    probe = new Date(probe.getTime() - DAY_MS);
  }

  return new Date(
    startOfTehranDay(probe).getTime() -
      (jalaliPartsOf(probe).day - 1) * DAY_MS,
  );
};

export const jalaliMonthBounds = (
  year: number,
  month: number,
): { start: Date; end: Date } => ({
  start: jalaliMonthStart(year, month),
  end: jalaliMonthStart(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1),
});

export const previousJalaliMonth = (at: Date): JalaliMonth => {
  const { year, month } = jalaliPartsOf(at);

  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
};

export const formatJalaliMonth = ({ year, month }: JalaliMonth): string =>
  `${year}-${String(month).padStart(2, '0')}`;

export const isFirstJalaliDay = (at: Date): boolean =>
  jalaliPartsOf(at).day === 1;

// "1405/09/30 23:59" in Tehran time; digits are Latin so the SMS reads the same on every device.
export const formatJalaliTehranDateTime = (at: Date): string => {
  const { year, month, day } = jalaliPartsOf(at);
  const clock = new Date(at.getTime() + TEHRAN_OFFSET_MS).toISOString().slice(11, 16);
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${year}/${pad(month)}/${pad(day)} ${clock}`;
};
