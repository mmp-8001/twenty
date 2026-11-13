export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
// Fixed +03:30, correct since Iran dropped DST in 2022; revisit if it returns. Every Tehran-day and Jalali helper shifts by this.
export const TEHRAN_OFFSET_MS = 3.5 * HOUR_MS;

export const AWAITING_FIRST_CALL_DAYS = 7;
export const FOLLOW_UP_DAYS = 30;
