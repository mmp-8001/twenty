import { isJalaliLocale } from '@/localization/utils/isJalaliLocale';
import { format, type Locale } from 'date-fns';
import { format as formatJalali } from 'date-fns-jalali';
import { Temporal } from 'temporal-polyfill';

export const formatPlainDateISOString = ({
  date,
  dateFormat,
  localeCatalog,
}: {
  date: string;
  dateFormat: string;
  localeCatalog?: Locale;
}) => {
  const plainDate = Temporal.PlainDate.from(date);
  const jsDate = new Date(plainDate.year, plainDate.month - 1, plainDate.day);

  if (isJalaliLocale(localeCatalog)) {
    return formatJalali(jsDate, dateFormat, { locale: localeCatalog });
  }

  return format(jsDate, dateFormat, { locale: localeCatalog });
};
