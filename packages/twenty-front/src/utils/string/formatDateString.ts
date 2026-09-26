import { type Locale } from 'date-fns';

import { type DateFormat } from '@/localization/constants/DateFormat';
import { formatDateISOStringToCustomUnicodeFormat } from '@/localization/utils/formatDateISOStringToCustomUnicodeFormat';
import { formatDateISOStringToDate } from '@/localization/utils/formatDateISOStringToDate';
import { formatDateISOStringToRelativeDate } from '@/localization/utils/formatDateISOStringToRelativeDate';
import { isJalaliLocale } from '@/localization/utils/isJalaliLocale';
import { toPersianDigits } from '@/localization/utils/formatToPersianDigits';
import {
  FieldDateDisplayFormat,
  type FieldDateMetadataSettings,
} from '@/object-record/record-field/ui/types/FieldMetadata';
import { isDefined } from 'twenty-shared/utils';

export const formatDateString = ({
  value,
  timeZone,
  dateFormat,
  dateFieldSettings,
  localeCatalog,
}: {
  timeZone: string;
  dateFormat: DateFormat;
  value?: string | null;
  dateFieldSettings?: FieldDateMetadataSettings;
  localeCatalog: Locale;
}): string => {
  if (!isDefined(value)) {
    return '';
  }

  let result: string;

  switch (dateFieldSettings?.displayFormat) {
    case FieldDateDisplayFormat.RELATIVE:
      result = formatDateISOStringToRelativeDate({
        isoDate: value,
        isDayMaximumPrecision: true,
        localeCatalog,
        timeZone,
      });
      break;
    case FieldDateDisplayFormat.USER_SETTINGS:
      result = formatDateISOStringToDate({
        date: value,
        timeZone,
        dateFormat,
        localeCatalog,
      });
      break;
    case FieldDateDisplayFormat.CUSTOM:
      result = formatDateISOStringToCustomUnicodeFormat({
        date: value,
        timeZone,
        dateFormat: dateFieldSettings.customUnicodeDateFormat,
        localeCatalog,
      });
      break;
    default:
      result = formatDateISOStringToDate({
        date: value,
        timeZone,
        dateFormat,
        localeCatalog,
      });
  }

  // Persian-Indic digits are applied once here so every display path is
  // covered; date-fns-jalali emits Latin digits.
  if (isJalaliLocale(localeCatalog)) {
    return toPersianDigits(result);
  }

  return result;
};
