import { type Locale } from 'date-fns';

// date-fns-jalali ships its Persian locale under the fa-IR code, and the
// Gregorian->Jalali conversion lives in its format functions, not in the locale
// object — passing this catalog to plain date-fns formats Gregorian dates with
// Persian month names. So every formatter has to branch on the calendar.
export const isJalaliLocale = (localeCatalog?: Locale): boolean =>
  localeCatalog?.code === 'fa-IR';
