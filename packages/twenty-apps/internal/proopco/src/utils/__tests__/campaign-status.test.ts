import { describe, expect, it } from 'vitest';

import {
  computeCampaignStatus,
  yesterdayInTehran,
} from 'src/utils/campaign-status.util';

// 2026-11-12 00:00 Tehran is 2026-11-11 20:30 UTC.
const TEHRAN_MIDNIGHT = Date.parse('2026-11-11T20:30:00Z');
const MINUTE = 60_000;

describe('computeCampaignStatus', () => {
  const campaign = { startsAt: '2026-11-12', endsAt: '2026-11-13' };

  it('is Scheduled until Tehran midnight of the start day', () => {
    expect(computeCampaignStatus(campaign, new Date(TEHRAN_MIDNIGHT - MINUTE))).toBe('SCHEDULED');
    expect(computeCampaignStatus(campaign, new Date(TEHRAN_MIDNIGHT))).toBe('ACTIVE');
  });

  it('stays Active through 23:59:59 of the end day', () => {
    const endOfLastDay = TEHRAN_MIDNIGHT + 2 * 24 * 60 * MINUTE;

    expect(computeCampaignStatus(campaign, new Date(endOfLastDay - 1000))).toBe('ACTIVE');
    expect(computeCampaignStatus(campaign, new Date(endOfLastDay))).toBe('ENDED');
  });

  it('is open-ended without an end date', () => {
    expect(computeCampaignStatus({ startsAt: '2026-11-12', endsAt: null }, new Date('2030-01-01'))).toBe('ACTIVE');
  });

  it('ends a campaign that never started when End now sets endsAt to yesterday', () => {
    const now = new Date(TEHRAN_MIDNIGHT + 60 * MINUTE);

    expect(yesterdayInTehran(now)).toBe('2026-11-11');
    expect(computeCampaignStatus({ startsAt: '2026-12-01', endsAt: yesterdayInTehran(now) }, now)).toBe('ENDED');
  });

  it('crosses Esfand into Farvardin on the Tehran calendar', () => {
    // 2027-03-21 00:00 Tehran (1 Farvardin 1406) is 2027-03-20 20:30 UTC.
    const now = new Date(Date.parse('2027-03-20T20:31:00Z'));

    expect(yesterdayInTehran(now)).toBe('2027-03-20');
    expect(computeCampaignStatus({ startsAt: '2027-03-01', endsAt: '2027-03-20' }, now)).toBe('ENDED');
  });
});
