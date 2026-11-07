import { startOfTehranDay } from 'src/utils/call-windows.util';

const DAY_MS = 24 * 60 * 60 * 1000;
// Same fixed +03:30 as call-windows.util, so Jalali days and Tehran days always agree.
const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;

const jalaliFormat = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

export type JalaliParts = { year: number; month: number; day: number };

export const jalaliPartsOf = (at: Date): JalaliParts => {
  const parts = jalaliFormat.formatToParts(new Date(at.getTime() + TEHRAN_OFFSET_MS));
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);

  return { year: read('year'), month: read('month'), day: read('day') };
};

const monthIndex = ({ year, month }: { year: number; month: number }) => year * 12 + month;

// Start (inclusive) of a Jalali month as a UTC instant: Tehran midnight of its first day.
export const jalaliMonthStart = (year: number, month: number): Date => {
  // Farvardin 1 falls on 20 or 21 March; a day-by-day walk from the guess lands inside the month.
  let probe = new Date(Date.UTC(year + 621, 2, 21) + (month - 1) * 30 * DAY_MS);

  while (monthIndex(jalaliPartsOf(probe)) < monthIndex({ year, month })) {
    probe = new Date(probe.getTime() + DAY_MS);
  }

  while (monthIndex(jalaliPartsOf(probe)) > monthIndex({ year, month })) {
    probe = new Date(probe.getTime() - DAY_MS);
  }

  return new Date(startOfTehranDay(probe).getTime() - (jalaliPartsOf(probe).day - 1) * DAY_MS);
};

export const jalaliMonthBounds = (year: number, month: number): { start: Date; end: Date } => ({
  start: jalaliMonthStart(year, month),
  end: jalaliMonthStart(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1),
});

export const previousJalaliMonth = (at: Date): { year: number; month: number } => {
  const { year, month } = jalaliPartsOf(at);

  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
};

// COM-04: the rollup runs once Tehran has reached the first day of a Jalali month.
export const isFirstJalaliDay = (at: Date): boolean => jalaliPartsOf(at).day === 1;
