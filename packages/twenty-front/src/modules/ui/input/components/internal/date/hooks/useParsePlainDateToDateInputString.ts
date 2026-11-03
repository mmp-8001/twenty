import { useDateTimeFormat } from '@/localization/hooks/useDateTimeFormat';
import { formatPlainDateToJalaliInputString } from '@/ui/input/components/internal/date/utils/jalaliDateInput';

import { format, parse } from 'date-fns';
import { Temporal } from 'temporal-polyfill';
import { DATE_TYPE_FORMAT } from 'twenty-shared/constants';
import { WorkspaceMemberCalendarEnum } from '~/generated-metadata/graphql';
import { getDateFormatStringForDatePickerInputMask } from '~/utils/date-utils';

export const useParsePlainDateToDateInputString = () => {
  const { dateFormat, calendar } = useDateTimeFormat();

  const parsePlainDateToDateInputString = (plainDate: string) => {
    if (calendar === WorkspaceMemberCalendarEnum.JALALI) {
      return formatPlainDateToJalaliInputString(
        Temporal.PlainDate.from(plainDate),
        dateFormat,
      );
    }

    const parsingFormat = getDateFormatStringForDatePickerInputMask(dateFormat);

    const parsedDate = parse(plainDate, DATE_TYPE_FORMAT, new Date());

    const formattedDate = format(parsedDate, parsingFormat);

    return formattedDate;
  };

  return {
    parsePlainDateToDateInputString,
  };
};
