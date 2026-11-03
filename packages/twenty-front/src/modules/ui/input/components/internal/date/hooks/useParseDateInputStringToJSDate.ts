import { useDateTimeFormat } from '@/localization/hooks/useDateTimeFormat';
import {
  parseJalaliInputStringToPlainDate,
  plainDateToLocalDate,
} from '@/ui/input/components/internal/date/utils/jalaliDateInput';
import { isValid, parse } from 'date-fns';
import { isDefined } from 'twenty-shared/utils';
import { WorkspaceMemberCalendarEnum } from '~/generated-metadata/graphql';
import { getDateFormatStringForDatePickerInputMask } from '~/utils/date-utils';

export const useParseDateInputStringToJSDate = () => {
  const { dateFormat, calendar } = useDateTimeFormat();

  const parseDateInputStringToJSDate = (dateAsString: string) => {
    if (calendar === WorkspaceMemberCalendarEnum.JALALI) {
      const plainDate = parseJalaliInputStringToPlainDate(
        dateAsString,
        dateFormat,
      );

      return isDefined(plainDate) ? plainDateToLocalDate(plainDate) : null;
    }

    const parsingFormat = getDateFormatStringForDatePickerInputMask(dateFormat);

    const parsedDate = parse(dateAsString, parsingFormat, new Date());

    if (!isValid(parsedDate)) {
      return null;
    }

    return parsedDate;
  };

  return {
    parseDateInputStringToJSDate,
  };
};
