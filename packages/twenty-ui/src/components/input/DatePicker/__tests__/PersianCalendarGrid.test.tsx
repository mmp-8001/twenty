import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';

import { DatePicker } from '../DatePicker';

const Example = ({ onValueChange }: { onValueChange: (v: string) => void }) => {
  const [viewedMonth, setViewedMonth] = useState('1405-08');

  return (
    <DatePicker
      calendar="persian"
      value="2026-11-03"
      onValueChange={onValueChange}
      viewedMonth={viewedMonth}
      onViewedMonthChange={setViewedMonth}
      weekStart={6}
      locale="en-US"
      previousMonthLabel="Previous"
      nextMonthLabel="Next"
      monthLabel="Month"
      yearLabel="Year"
    />
  );
};

describe('PersianCalendarGrid keyboard navigation', () => {
  it('moves focus with arrows without selecting, then selects on Enter', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Example onValueChange={onValueChange} />);

    screen.getByRole('button', { name: '2026-11-03' }).focus();
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('button', { name: '2026-11-10' })).toHaveFocus();
    expect(onValueChange).not.toHaveBeenCalled();

    await user.keyboard('{Enter}');

    expect(onValueChange).toHaveBeenLastCalledWith('2026-11-10');
  });

  it('crosses into the next Jalali month and keeps focus on the target day', async () => {
    const user = userEvent.setup();
    render(<Example onValueChange={vi.fn()} />);

    // 1405-08-30 is 2026-11-21; ArrowRight lands on 1 Azar (2026-11-22).
    screen.getByRole('button', { name: '2026-11-21' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(
      await screen.findByRole('button', { name: '2026-11-22' }),
    ).toHaveFocus();
  });
});
