import { describe, expect, it } from 'vitest';

import { computeFollowupSweepUpdate } from 'src/logic-functions/utils/compute-followup-sweep-update.util';

const referenceDate = new Date('2026-03-10T00:00:00Z');
const base = {
  stage: 'PENDING' as const,
  ownerId: 'agent',
  expiresAt: null,
  retryExpiresAt: null,
};
const sweep = (followup: Parameters<typeof computeFollowupSweepUpdate>[0]['followup']) =>
  computeFollowupSweepUpdate({ followup, referenceDate, poolDays: 7 });

describe('computeFollowupSweepUpdate', () => {
  it('expires a Pending Followup once its window passed', () => {
    expect(sweep({ ...base, expiresAt: '2026-03-10T00:00:00Z' })).toEqual({ stage: 'EXPIRED' });
  });

  it('leaves a Pending Followup inside its window', () => {
    expect(sweep({ ...base, expiresAt: '2026-03-11T00:00:00Z' })).toBeNull();
  });

  it('moves an overdue owned Retry Pending Followup to the Pool', () => {
    expect(
      sweep({ ...base, stage: 'RETRY_PENDING', retryExpiresAt: '2026-03-09T00:00:00Z' }),
    ).toEqual({ ownerId: null, retryExpiresAt: '2026-03-17T00:00:00.000Z' });
  });

  it('expires an overdue Pool Followup as not followed up', () => {
    expect(
      sweep({ ...base, stage: 'RETRY_PENDING', ownerId: null, retryExpiresAt: '2026-03-09T00:00:00Z' }),
    ).toEqual({ stage: 'EXPIRED', failureReason: 'NOT_FOLLOWED_UP' });
  });

  it.each(['SUCCEEDED', 'FAILED', 'EXPIRED'] as const)('ignores a %s Followup', (stage) => {
    expect(sweep({ ...base, stage, expiresAt: '2020-01-01T00:00:00Z' })).toBeNull();
  });
});
