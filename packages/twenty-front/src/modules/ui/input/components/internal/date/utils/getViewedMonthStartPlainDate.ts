import { Temporal } from 'temporal-polyfill';
import { WorkspaceMemberCalendarEnum } from '~/generated-metadata/graphql';

// A Jalali picker's viewed month is a Jalali YYYY-MM, so it cannot be parsed as an ISO date.
export const getViewedMonthStartPlainDate = (
  viewedMonth: string,
  calendar?: WorkspaceMemberCalendarEnum,
) => {
  if (calendar !== WorkspaceMemberCalendarEnum.JALALI) {
    return Temporal.PlainDate.from(`${viewedMonth}-01`);
  }

  const [year, month] = viewedMonth.split('-').map(Number);

  return Temporal.PlainDate.from({
    year,
    month,
    day: 1,
    calendar: 'persian',
  }).withCalendar('iso8601');
};
