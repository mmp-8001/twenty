import { type DateFormat } from '@/localization/constants/DateFormat';
import { type TimeFormat } from '@/localization/constants/TimeFormat';
import { isJalaliLocale } from '@/localization/utils/isJalaliLocale';
import { isValid, type Locale } from 'date-fns';
import { format as formatJalali } from 'date-fns-jalali';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export const formatDateISOStringToDateTime = ({
  date,
  timeZone,
  dateFormat,
  timeFormat,
  localeCatalog,
}: {
  date: string;
  timeZone: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  localeCatalog: Locale;
}) => {
  const parsedDate = new Date(date);

  if (!isValid(parsedDate)) {
    return '';
  }

  const combinedFormat = `${dateFormat} ${timeFormat}`;

  // formatInTimeZone delegates to date-fns format, which is always Gregorian.
  // Shift to the zoned instant first, then let date-fns-jalali convert the
  // calendar.
  if (isJalaliLocale(localeCatalog)) {
    return formatJalali(toZonedTime(parsedDate, timeZone), combinedFormat, {
      locale: localeCatalog,
    });
  }

  // TODO: replace this with shiftPointInTimeToFromTimezoneDifference to remove date-fns-tz, which formatInTimeZone is doig under the hood :
  // https://github.com/marnusw/date-fns-tz/blob/4f3383b26a5907a73b14512a2701f3dfd8cf1579/src/toZonedTime/index.ts#L36C9-L36C27
  return formatInTimeZone(parsedDate, timeZone, combinedFormat, {
    locale: localeCatalog,
  });
};
