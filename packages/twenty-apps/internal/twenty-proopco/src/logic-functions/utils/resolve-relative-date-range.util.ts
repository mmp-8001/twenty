// Tehran has no daylight saving time since 2022, so a fixed offset is exact (GEN-01).
const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const RELATIVE_VALUE = /^(THIS|PAST|NEXT)_(\d*)_(DAY|WEEK|MONTH|YEAR)/;

type Unit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

// Both bounds are Tehran calendar boundaries; `start` is inclusive, `end` exclusive.
export type DateRange = { start: Date; end: Date };

// Works on a "Tehran wall clock as UTC" timestamp so UTC getters read Tehran fields.
const periodStart = (wallClock: Date, unit: Unit): number => {
  const year = wallClock.getUTCFullYear();
  const month = wallClock.getUTCMonth();
  const day = wallClock.getUTCDate();

  switch (unit) {
    case 'DAY':
      return Date.UTC(year, month, day);
    // shortcut: weeks start on Monday, the Twenty default; upgrade if Persian Saturday weeks are wanted.
    case 'WEEK':
      return (
        Date.UTC(year, month, day) -
        ((wallClock.getUTCDay() + 6) % 7) * MILLISECONDS_PER_DAY
      );
    case 'MONTH':
      return Date.UTC(year, month, 1);
    case 'YEAR':
      return Date.UTC(year, 0, 1);
  }
};

const addPeriods = (start: number, unit: Unit, amount: number): number => {
  const date = new Date(start);

  switch (unit) {
    case 'DAY':
      return start + amount * MILLISECONDS_PER_DAY;
    case 'WEEK':
      return start + amount * 7 * MILLISECONDS_PER_DAY;
    case 'MONTH':
      return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1);
    case 'YEAR':
      return Date.UTC(date.getUTCFullYear() + amount, 0, 1);
  }
};

export const toTehranWallClock = (instant: Date): Date =>
  new Date(instant.getTime() + TEHRAN_OFFSET_MS);

// Plain date of a Tehran day, for DATE fields.
export const toTehranPlainDate = (instant: Date): string =>
  toTehranWallClock(instant).toISOString().slice(0, 10);

export const resolveRelativeDateRange = (
  value: string,
  now: Date,
): DateRange | undefined => {
  const match = RELATIVE_VALUE.exec(value);

  if (!match) {
    return undefined;
  }

  const [, direction, amountText, unit] = match;
  const amount = Number(amountText || 1);
  const current = periodStart(toTehranWallClock(now), unit as Unit);
  const next = addPeriods(current, unit as Unit, 1);
  const bounds =
    direction === 'PAST'
      ? [addPeriods(current, unit as Unit, -amount), current]
      : direction === 'NEXT'
        ? [next, addPeriods(next, unit as Unit, amount)]
        : [current, next];

  return {
    start: new Date(bounds[0] - TEHRAN_OFFSET_MS),
    end: new Date(bounds[1] - TEHRAN_OFFSET_MS),
  };
};
