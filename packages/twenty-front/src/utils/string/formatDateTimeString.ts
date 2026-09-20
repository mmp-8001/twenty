import { type DateFormat } from '@/localization/constants/DateFormat';
import { type TimeFormat } from '@/localization/constants/TimeFormat';
import { formatDateISOStringToCustomUnicodeFormat } from '@/localization/utils/formatDateISOStringToCustomUnicodeFormat';
import { formatDateISOStringToDateTime } from '@/localization/utils/formatDateISOStringToDateTime';
import { formatDateISOStringToRelativeDate } from '@/localization/utils/formatDateISOStringToRelativeDate';
import { isJalaliLocale } from '@/localization/utils/isJalaliLocale';
import { toPersianDigits } from '@/localization/utils/formatToPersianDigits';
import {
  FieldDateDisplayFormat,
  type FieldDateMetadataSettings,
} from '@/object-record/record-field/ui/types/FieldMetadata';
import { type Locale } from 'date-fns';

export const formatDateTimeString = ({
  value,
  timeZone,
  dateFormat,
  timeFormat,
  dateFieldSettings,
  localeCatalog,
}: {
  timeZone: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  value?: string | null;
  dateFieldSettings?: FieldDateMetadataSettings;
  localeCatalog: Locale;
}) => {
  if (!value) {
    return '';
  }

  let result: string;

  switch (dateFieldSettings?.displayFormat) {
    case FieldDateDisplayFormat.RELATIVE:
      result = formatDateISOStringToRelativeDate({
        isoDate: value,
        localeCatalog,
        timeZone,
      });
      break;
    case FieldDateDisplayFormat.USER_SETTINGS:
      result = formatDateISOStringToDateTime({
        date: value,
        timeZone,
        dateFormat,
        timeFormat,
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
      result = formatDateISOStringToDateTime({
        date: value,
        timeZone,
        dateFormat,
        timeFormat,
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
