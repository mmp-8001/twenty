import { DATE_PICKER_YEAR_SELECT_OPTIONS } from '@/ui/input/components/internal/date/constants/DatePickerYearSelectOptions';
import { GREGORIAN_TO_PERSIAN_YEAR_OFFSET } from 'twenty-ui/components/input';
import { WorkspaceMemberCalendarEnum } from '~/generated-metadata/graphql';

export const getYearSelectOptions = (calendar?: WorkspaceMemberCalendarEnum) =>
  calendar === WorkspaceMemberCalendarEnum.JALALI
    ? DATE_PICKER_YEAR_SELECT_OPTIONS.map(({ value }) => ({
        label: (value - GREGORIAN_TO_PERSIAN_YEAR_OFFSET).toString(),
        value: value - GREGORIAN_TO_PERSIAN_YEAR_OFFSET,
      }))
    : DATE_PICKER_YEAR_SELECT_OPTIONS;
