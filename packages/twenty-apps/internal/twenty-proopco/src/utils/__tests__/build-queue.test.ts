import { describe, expect, it } from 'vitest';

import { buildQueue, queueColour, summarizeQueue } from 'src/utils/build-queue.util';

// 14:00 Tehran on 2026-01-10.
const NOW = new Date('2026-01-10T10:30:00Z');
const HOUR_MS = 3_600_000;
const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs);

describe('queueColour', () => {
  it.each([
    [at(1), 'GREEN'],
    [at(0), 'YELLOW'],
    [at(-2 * HOUR_MS), 'YELLOW'],
    [at(-2 * HOUR_MS - 1), 'RED'],
    // 00:30 on the same Tehran day is 13.5 h ago, so red by the 2 h rule too
    [at(-13.5 * HOUR_MS), 'RED'],
    [at(5 * 24 * HOUR_MS), 'GREEN'],
  ])('colours %s as %s', (nextCallAt, expected) => {
    expect(queueColour(nextCallAt, NOW)).toBe(expected);
  });

  it('is red from the previous Tehran day even a minute after midnight (Q-07)', () => {
    const justAfterMidnight = new Date('2026-01-09T20:31:00Z');

    expect(queueColour(new Date('2026-01-09T20:29:00Z'), justAfterMidnight)).toBe('RED');
    expect(queueColour(new Date('2026-01-09T20:30:30Z'), justAfterMidnight)).toBe('YELLOW');
  });
});

describe('queue tabs (QS4)', () => {
  const overdue = [1, 2, 3].map((index) => ({ id: `late-${index}`, nextCallAt: at(-index * 24 * HOUR_MS).toISOString() }));
  const today = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => ({ id: `today-${index}`, nextCallAt: at(index * 0.5 * HOUR_MS).toISOString() }));
  const future = Array.from({ length: 28 }, (_, index) => ({ id: `future-${index}`, nextCallAt: at((index + 2) * 24 * HOUR_MS).toISOString() }));
  const rows = [...future, ...today, ...overdue];

  it('shows the overdue ones first, then today by time, and everyone on All', () => {
    const todayTab = buildQueue({ rows, tab: 'TODAY', now: NOW });

    expect(todayTab).toHaveLength(12);
    expect(todayTab.slice(0, 3).map(({ colour }) => colour)).toEqual(['RED', 'RED', 'RED']);
    expect(todayTab.slice(3).every(({ colour }) => colour === 'GREEN')).toBe(true);
    expect(buildQueue({ rows, tab: 'ALL', now: NOW })).toHaveLength(40);
  });

  it('counts the summary', () => {
    expect(summarizeQueue(rows, NOW)).toEqual({ red: 3, yellow: 0, green: 37, today: 12, all: 40 });
  });
});
