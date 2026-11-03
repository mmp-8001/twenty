import { clsx } from 'clsx';

import { isDefined } from '@ui/utilities/utils/isDefined';

import styles from '../DatePicker.module.scss';
import { type DatePickerProps } from '../types/DatePickerProps';
import { DATE_PICKER_CONSTANTS } from './datePickerConstants';
import {
  getPersianMonthLength,
  MILLISECONDS_PER_DAY,
  persianDateToIso,
} from './persianCalendar';

const REFERENCE_SUNDAY_TIMESTAMP = Date.UTC(2023, 0, 1);

type PersianCalendarGridProps = Pick<
  DatePickerProps,
  | 'value'
  | 'highlightedRange'
  | 'weekStart'
  | 'locale'
  | 'weekdayLabels'
  | 'isDateUnavailable'
  | 'readOnly'
  | 'disabled'
> & {
  year: number;
  month: number;
  onDayClick: (isoDate: string) => void;
};

export const PersianCalendarGrid = ({
  year,
  month,
  value,
  highlightedRange,
  weekStart,
  locale,
  weekdayLabels,
  isDateUnavailable,
  readOnly,
  disabled,
  onDayClick,
}: PersianCalendarGridProps) => {
  const firstDayIso = persianDateToIso({ year, month, day: 1 });
  const leadingBlankCount =
    (new Date(`${firstDayIso}T00:00:00Z`).getUTCDay() -
      weekStart +
      DATE_PICKER_CONSTANTS.DAYS_PER_WEEK) %
    DATE_PICKER_CONSTANTS.DAYS_PER_WEEK;
  const monthLength = getPersianMonthLength(year, month);
  const weekdayFormatter = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    timeZone: 'UTC',
  });

  const weekdayNames = Array.from(
    { length: DATE_PICKER_CONSTANTS.DAYS_PER_WEEK },
    (_, offset) => {
      const dayIndex =
        (weekStart + offset) % DATE_PICKER_CONSTANTS.DAYS_PER_WEEK;

      return (
        weekdayLabels?.[dayIndex] ??
        weekdayFormatter.format(
          new Date(
            REFERENCE_SUNDAY_TIMESTAMP + dayIndex * MILLISECONDS_PER_DAY,
          ),
        )
      );
    },
  );

  const days = Array.from({ length: monthLength }, (_, index) => {
    const day = index + 1;
    const isoDate = persianDateToIso({ year, month, day });

    return { day, isoDate };
  });

  return (
    <div className={styles.persianGrid}>
      {weekdayNames.map((name, index) => (
        <span key={index} className={styles.persianDayName}>
          {name}
        </span>
      ))}
      {Array.from({ length: leadingBlankCount }, (_, index) => (
        <span key={`blank-${index}`} />
      ))}
      {days.map(({ day, isoDate }) => {
        const isSelected = isoDate === value;
        const isInRange =
          isDefined(highlightedRange) &&
          isoDate >= highlightedRange.start &&
          isoDate <= highlightedRange.end;

        return (
          <button
            key={isoDate}
            type="button"
            className={clsx(
              styles.persianDay,
              (isSelected || isInRange) && styles.persianDaySelected,
            )}
            disabled={
              disabled === true ||
              readOnly === true ||
              isDateUnavailable?.(isoDate) === true
            }
            aria-pressed={isSelected}
            aria-label={isoDate}
            onClick={() => onDayClick(isoDate)}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
};
