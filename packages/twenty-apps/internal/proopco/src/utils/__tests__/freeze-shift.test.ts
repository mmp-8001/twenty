import { describe, expect, it } from 'vitest';

import { DAY_MS } from 'src/constants/time.constant';
import { daysFrozenOf } from 'src/logic-functions/utils/freeze-agent.util';
import { freezeShiftMs } from 'src/logic-functions/utils/transfer-contacts.util';

const ISO = (ms: number) => new Date(ms).toISOString();
const T0 = Date.UTC(2026, 0, 1);

describe('freezeShiftMs', () => {
  it('is the time since the freeze for a deal opened before it', () => {
    expect(freezeShiftMs(ISO(T0 + 5 * DAY_MS), ISO(T0), ISO(T0 + 15 * DAY_MS))).toBe(10 * DAY_MS);
  });

  it('counts only from the opening for a deal opened while frozen', () => {
    expect(freezeShiftMs(ISO(T0), ISO(T0 + 3 * DAY_MS), ISO(T0 + 5 * DAY_MS))).toBe(2 * DAY_MS);
  });

  it('is zero for an agent that is not frozen', () => {
    expect(freezeShiftMs(null, ISO(T0), ISO(T0 + DAY_MS))).toBe(0);
  });
});

describe('daysFrozenOf', () => {
  it('counts whole days', () => {
    expect(daysFrozenOf(ISO(T0), new Date(T0 + 7 * DAY_MS + 1000))).toBe(7);
    expect(daysFrozenOf(ISO(T0), new Date(T0 + 6 * DAY_MS + 1000))).toBe(6);
  });
});
