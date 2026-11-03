import { isNonEmptyString } from '@sniptt/guards';
import { doNotTranslate } from 'twenty-shared/i18n';
import { SOURCE_LOCALE } from 'twenty-shared/translations';
import { WorkspaceMemberCalendarEnum } from '~/generated-metadata/graphql';

const MONTH_COUNT = 12;

export const getMonthSelectOptions = (
  locale?: string,
  calendar?: WorkspaceMemberCalendarEnum,
): { label: string; value: number }[] => {
  const isJalali = calendar === WorkspaceMemberCalendarEnum.JALALI;
  const formatter = new Intl.DateTimeFormat(
    isNonEmptyString(locale) ? locale : SOURCE_LOCALE,
    {
      month: 'long',
      ...(isJalali
        ? {
            calendar: doNotTranslate('persian'),
            timeZone: doNotTranslate('UTC'),
          }
        : {}),
    },
  );

  return Array.from({ length: MONTH_COUNT }, (_, index) => ({
    // The 30th of Gregorian month March + index always falls inside Jalali month index + 1.
    label: formatter.format(
      isJalali
        ? new Date(Date.UTC(2024, 2 + index, 30))
        : new Date(0, index, 1),
    ),
    value: index + 1,
  }));
};
