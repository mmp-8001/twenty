import { useDateTimeFormat } from '@/localization/hooks/useDateTimeFormat';

import {
  formatPlainDateToJalaliInputString,
  localDateToPlainDate,
} from '@/ui/input/components/internal/date/utils/jalaliDateInput';
import { format } from 'date-fns';
import { WorkspaceMemberCalendarEnum } from '~/generated-metadata/graphql';
import { getDateFormatStringForDatePickerInputMask } from '~/utils/date-utils';

export const useParseJSDateToIMaskDateInputString = () => {
  const { dateFormat, calendar } = useDateTimeFormat();

  const parseIMaskJSDateIMaskDateInputString = (jsDate: Date) => {
    if (calendar === WorkspaceMemberCalendarEnum.JALALI) {
      return formatPlainDateToJalaliInputString(
        localDateToPlainDate(jsDate),
        dateFormat,
      );
    }

    const parsingFormat = getDateFormatStringForDatePickerInputMask(dateFormat);

    const formattedDate = format(jsDate, parsingFormat);

    return formattedDate;
  };

  return {
    parseIMaskJSDateIMaskDateInputString,
  };
};
