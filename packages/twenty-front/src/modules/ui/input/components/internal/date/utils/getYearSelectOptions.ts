import { DATE_PICKER_YEAR_SELECT_OPTIONS } from '@/ui/input/components/internal/date/constants/DatePickerYearSelectOptions';
import { WorkspaceMemberCalendarEnum } from '~/generated-metadata/graphql';

const GREGORIAN_TO_JALALI_YEAR_OFFSET = 621;

export const getYearSelectOptions = (calendar?: WorkspaceMemberCalendarEnum) =>
  calendar === WorkspaceMemberCalendarEnum.JALALI
    ? DATE_PICKER_YEAR_SELECT_OPTIONS.map(({ value }) => ({
        label: (value - GREGORIAN_TO_JALALI_YEAR_OFFSET).toString(),
        value: value - GREGORIAN_TO_JALALI_YEAR_OFFSET,
      }))
    : DATE_PICKER_YEAR_SELECT_OPTIONS;
