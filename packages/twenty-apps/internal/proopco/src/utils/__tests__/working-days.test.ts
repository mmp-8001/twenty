import { describe, expect, it } from 'vitest';

import { workingDaysOf } from 'src/utils/working-days.util';

const range = (from: string, to: string) => ({ from: new Date(from), to: new Date(to) });

describe('workingDaysOf', () => {
  it('counts Tehran days from the agent creation day to today, both inclusive', () => {
    // 2025-11-01 21:00Z is already 2 Nov in Tehran (UTC+3:30)
    expect(workingDaysOf({ ...range('2025-10-30T10:00:00Z', '2025-11-02T10:00:00Z'), createdAt: new Date('2025-10-20T10:00:00Z'), freezes: [] })).toBe(4);
  });

  it('starts at the later of the period start and the agent creation day', () => {
    expect(workingDaysOf({ ...range('2025-10-01T00:00:00Z', '2025-10-10T10:00:00Z'), createdAt: new Date('2025-10-08T10:00:00Z'), freezes: [] })).toBe(3);
  });

  it('removes whole Tehran days overlapping a freeze, even a partial overlap', () => {
    const freezes = [{ startedAt: new Date('2025-10-03T09:00:00Z'), endedAt: new Date('2025-10-05T09:00:00Z') }];

    expect(workingDaysOf({ ...range('2025-10-01T00:00:00Z', '2025-10-10T10:00:00Z'), createdAt: new Date('2025-09-01T00:00:00Z'), freezes })).toBe(7);
  });

  it('treats an open freeze as lasting until the end of the range and never counts a day twice', () => {
    const freezes = [
      { startedAt: new Date('2025-10-08T09:00:00Z'), endedAt: new Date('2025-10-08T12:00:00Z') },
      { startedAt: new Date('2025-10-08T13:00:00Z'), endedAt: null },
    ];

    expect(workingDaysOf({ ...range('2025-10-01T00:00:00Z', '2025-10-10T10:00:00Z'), createdAt: new Date('2025-09-01T00:00:00Z'), freezes })).toBe(7);
  });

  it('is zero before the agent exists', () => {
    expect(workingDaysOf({ ...range('2025-10-01T00:00:00Z', '2025-10-05T10:00:00Z'), createdAt: new Date('2025-11-01T00:00:00Z'), freezes: [] })).toBe(0);
  });
});
