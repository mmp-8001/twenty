import { DateFormat } from '@/localization/constants/DateFormat';
import { getLatinDigitsLocale } from '@/localization/utils/getLatinDigitsLocale';
import { doNotTranslate } from 'twenty-shared/i18n';
import { isDateWithoutTime } from 'twenty-shared/utils';

// Date-only values are calendar days, so they must not shift with the time zone.
export const formatJalaliDate = ({
  date,
  timeZone,
  dateFormat,
}: {
  date: string;
  timeZone: string;
  dateFormat: DateFormat;
}) => {
  const isPlainDate = isDateWithoutTime(date);

  const parts = new Intl.DateTimeFormat(getLatinDigitsLocale(), {
    calendar: 'persian',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: isPlainDate ? doNotTranslate('UTC') : timeZone,
  }).formatToParts(
    new Date(isPlainDate ? `${date}${doNotTranslate('T00:00:00Z')}` : date),
  );

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const day = getPart('day');
  const month = getPart('month');
  const year = getPart('year');

  switch (dateFormat) {
    case DateFormat.YEAR_FIRST:
      return `${year} ${month} ${day}`;
    case DateFormat.DAY_FIRST:
      return `${day} ${month}, ${year}`;
    default:
      return `${month} ${day}, ${year}`;
  }
};
