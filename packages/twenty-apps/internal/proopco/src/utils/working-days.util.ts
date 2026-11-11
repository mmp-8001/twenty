import { DAY_MS, TEHRAN_OFFSET_MS } from 'src/constants/time.constant';

const tehranDayIndex = (at: Date) => Math.floor((at.getTime() + TEHRAN_OFFSET_MS) / DAY_MS);

type FreezeSpan = { startedAt: Date; endedAt: Date | null };

// Tehran days from the later of the range start and the agent's creation day to the range end, minus
// every whole Tehran day that overlaps a freeze (an open freeze runs to the range end).
export const workingDaysOf = ({
  from,
  to,
  createdAt,
  freezes,
}: {
  from: Date;
  to: Date;
  createdAt: Date;
  freezes: FreezeSpan[];
}): number => {
  const first = Math.max(tehranDayIndex(from), tehranDayIndex(createdAt));
  const last = tehranDayIndex(to);
  const frozen = new Set<number>();

  for (const { startedAt, endedAt } of freezes) {
    const start = Math.max(first, tehranDayIndex(startedAt));
    const end = Math.min(last, tehranDayIndex(endedAt ?? to));

    for (let day = start; day <= end; day += 1) {
      frozen.add(day);
    }
  }

  return Math.max(0, last - first + 1 - frozen.size);
};
