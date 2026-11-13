import { describe, expect, it } from 'vitest';

import { eligibilityRefreshJobOf } from 'src/utils/eligibility-refresh-window.util';

describe('eligibilityRefreshJobOf', () => {
  it('gives every change in one minute the same job, run just after the minute ends', () => {
    const early = eligibilityRefreshJobOf(new Date('2026-11-13T10:00:01Z'));
    const late = eligibilityRefreshJobOf(new Date('2026-11-13T10:00:59Z'));

    expect(early.jobId).toBe(late.jobId);
    expect([early.delayMs, late.delayMs]).toEqual([64_000, 6_000]);
  });

  it('starts a new job in the next minute', () => {
    expect(eligibilityRefreshJobOf(new Date('2026-11-13T10:01:00Z')).jobId).not.toBe(
      eligibilityRefreshJobOf(new Date('2026-11-13T10:00:59Z')).jobId,
    );
  });
});
