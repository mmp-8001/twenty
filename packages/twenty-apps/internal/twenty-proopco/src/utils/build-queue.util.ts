import { endOfTehranDay, startOfTehranDay } from 'src/utils/call-windows.util';

const HOUR_MS = 60 * 60 * 1000;

// LOGIC Q-07: yellow lasts from the set time until this long after it.
export const QUEUE_YELLOW_DURATION_MS = 2 * HOUR_MS;

export type QueueColour = 'GREEN' | 'YELLOW' | 'RED';

export type QueueTab = 'TODAY' | 'ALL';

export type QueueRowInput = { nextCallAt: string };

export const queueColour = (nextCallAt: Date, now: Date): QueueColour => {
  const overdueMs = now.getTime() - nextCallAt.getTime();

  if (overdueMs < 0) {
    return 'GREEN';
  }

  // Red also covers anything from an earlier Tehran day, however recent.
  if (nextCallAt < startOfTehranDay(now) || overdueMs > QUEUE_YELLOW_DURATION_MS) {
    return 'RED';
  }

  return 'YELLOW';
};

export const buildQueue = <TRow extends QueueRowInput>({
  rows,
  tab,
  now,
}: {
  rows: TRow[];
  tab: QueueTab;
  now: Date;
}): (TRow & { colour: QueueColour })[] => {
  const endOfToday = endOfTehranDay(now);

  return rows
    .map((row) => ({ ...row, colour: queueColour(new Date(row.nextCallAt), now) }))
    .filter(({ nextCallAt }) => tab === 'ALL' || new Date(nextCallAt) < endOfToday)
    .sort((a, b) => new Date(a.nextCallAt).getTime() - new Date(b.nextCallAt).getTime());
};

export const summarizeQueue = (rows: QueueRowInput[], now: Date) => {
  const summary = { red: 0, yellow: 0, green: 0, today: 0, all: rows.length };
  const endOfToday = endOfTehranDay(now);

  for (const { nextCallAt } of rows) {
    const colour = queueColour(new Date(nextCallAt), now);

    summary[colour === 'RED' ? 'red' : colour === 'YELLOW' ? 'yellow' : 'green'] += 1;

    if (new Date(nextCallAt) < endOfToday) {
      summary.today += 1;
    }
  }

  return summary;
};
