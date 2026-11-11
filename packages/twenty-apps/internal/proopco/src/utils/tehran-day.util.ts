import { DAY_MS, TEHRAN_OFFSET_MS } from 'src/constants/time.constant';

// shortcut: fixed +03:30, correct for Tehran since 2022; revisit if Iran reintroduces DST.
export const startOfTehranDay = (at: Date): Date =>
  new Date(
    Math.floor((at.getTime() + TEHRAN_OFFSET_MS) / DAY_MS) * DAY_MS -
      TEHRAN_OFFSET_MS,
  );

export const endOfTehranDay = (at: Date): Date =>
  new Date(startOfTehranDay(at).getTime() + DAY_MS);
