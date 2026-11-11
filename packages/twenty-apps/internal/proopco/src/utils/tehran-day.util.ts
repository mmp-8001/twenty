import { DAY_MS, TEHRAN_OFFSET_MS } from 'src/constants/time.constant';

export const startOfTehranDay = (at: Date): Date =>
  new Date(
    Math.floor((at.getTime() + TEHRAN_OFFSET_MS) / DAY_MS) * DAY_MS -
      TEHRAN_OFFSET_MS,
  );

export const endOfTehranDay = (at: Date): Date =>
  new Date(startOfTehranDay(at).getTime() + DAY_MS);

// A Campaign date is a calendar day in Tehran, written as YYYY-MM-DD.
export const startOfTehranDate = (tehranDate: string): Date =>
  new Date(Date.parse(`${tehranDate}T00:00:00Z`) - TEHRAN_OFFSET_MS);

export const tehranDateOf = (at: Date): string =>
  new Date(startOfTehranDay(at).getTime() + TEHRAN_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
