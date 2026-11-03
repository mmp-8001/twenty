import { getViewedMonthStartPlainDate } from '@/ui/input/components/internal/date/utils/getViewedMonthStartPlainDate';
import { WorkspaceMemberCalendarEnum } from '~/generated-metadata/graphql';

describe('getViewedMonthStartPlainDate', () => {
  it('reads a Gregorian year-month as the first of that month', () => {
    expect(getViewedMonthStartPlainDate('2026-03').toString()).toBe(
      '2026-03-01',
    );
  });

  it('reads a Jalali year-month as the Gregorian date of its first day', () => {
    expect(
      getViewedMonthStartPlainDate(
        '1405-01',
        WorkspaceMemberCalendarEnum.JALALI,
      ).toString(),
    ).toBe('2026-03-21');
  });
});
