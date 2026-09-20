import { type DateFormat } from '@/localization/constants/DateFormat';
import { formatPlainDateISOString } from '@/localization/utils/formatPlainDateISOString';
import { isJalaliLocale } from '@/localization/utils/isJalaliLocale';
import { type Locale } from 'date-fns';
import { format as formatJalali } from 'date-fns-jalali';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { isDateWithoutTime } from 'twenty-shared/utils';

export const formatDateISOStringToDate = ({
  date,
  timeZone,
  dateFormat,
  localeCatalog,
}: {
  date: string;
  timeZone: string;
  dateFormat: DateFormat;
  localeCatalog?: Locale;
}) => {
  if (isDateWithoutTime(date)) {
    return formatPlainDateISOString({ date, dateFormat, localeCatalog });
  }

  // formatInTimeZone delegates to date-fns format, which is always Gregorian.
  // Shift to the zoned instant first, then let date-fns-jalali convert the
  // calendar.
  if (isJalaliLocale(localeCatalog)) {
    return formatJalali(toZonedTime(new Date(date), timeZone), dateFormat, {
      locale: localeCatalog,
    });
  }

  return formatInTimeZone(new Date(date), timeZone, dateFormat, {
    locale: localeCatalog,
  });
};
