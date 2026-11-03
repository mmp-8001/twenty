import { doNotTranslate } from 'twenty-shared/i18n';
import {
  MILLISECONDS_PER_DAY,
  type DatePickerProps,
} from 'twenty-ui/components/input';

const REFERENCE_SUNDAY_TIMESTAMP = Date.UTC(2023, 0, 1);

export const getDatePickerWeekdayLabels = (
  locale: string,
): NonNullable<DatePickerProps['weekdayLabels']> => {
  const weekdayFormatter = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    timeZone: doNotTranslate('UTC'),
  });
  const formatWeekday = (dayIndex: number) =>
    weekdayFormatter.format(
      new Date(REFERENCE_SUNDAY_TIMESTAMP + dayIndex * MILLISECONDS_PER_DAY),
    );

  return [
    formatWeekday(0),
    formatWeekday(1),
    formatWeekday(2),
    formatWeekday(3),
    formatWeekday(4),
    formatWeekday(5),
    formatWeekday(6),
  ];
};
