import { describe, expect, it } from 'vitest';

import {
  computeUserAudience,
  isCampaignActive,
} from 'src/logic-functions/utils/compute-user-audience.util';

const NOW = new Date('2026-03-10T12:00:00Z');
const available = {
  currentOwnerId: null,
  permanentlyFailedAt: null,
  cooldownUntil: null,
};

describe('isCampaignActive', () => {
  it.each([
    ['active inside the window', 'ACTIVE', '2026-03-01T00:00:00Z', '2026-04-01T00:00:00Z', true],
    ['active with no end', 'ACTIVE', '2026-03-01T00:00:00Z', null, true],
    ['starts exactly now', 'ACTIVE', '2026-03-10T12:00:00Z', null, true],
    ['not started', 'ACTIVE', '2026-03-10T12:00:01Z', null, false],
    ['ends exactly now', 'ACTIVE', '2026-03-01T00:00:00Z', '2026-03-10T12:00:00Z', false],
    ['ended status', 'ENDED', '2026-03-01T00:00:00Z', null, false],
    ['no start', 'ACTIVE', null, null, false],
  ])('%s', (_name, status, startsAt, endsAt, expected) => {
    expect(isCampaignActive({ status, startsAt, endsAt }, NOW)).toBe(expected);
  });
});

describe('computeUserAudience', () => {
  const admins = { a: ['m2', 'm1'], b: ['m1', 'm3'], c: [] };

  it('unions the admins of every active campaign the user matches', () => {
    expect(
      computeUserAudience({
        person: available,
        activeCampaignIdsMatchingUser: ['b', 'a'],
        adminIdsByCampaignId: admins,
        now: NOW,
      }),
    ).toEqual({ visibleToMemberIds: ['m1', 'm2', 'm3'], candidateCampaignIds: ['a', 'b'] });
  });

  it('keeps a campaign without admins as a candidate only', () => {
    expect(
      computeUserAudience({
        person: available,
        activeCampaignIdsMatchingUser: ['c'],
        adminIdsByCampaignId: admins,
        now: NOW,
      }),
    ).toEqual({ visibleToMemberIds: [], candidateCampaignIds: ['c'] });
  });

  it.each([
    ['owned', { ...available, currentOwnerId: 'm1' }],
    ['permanently failed', { ...available, permanentlyFailedAt: '2026-01-01T00:00:00Z' }],
    ['cooling down', { ...available, cooldownUntil: '2026-03-10T12:00:01Z' }],
  ])('is empty when the user is %s', (_name, person) => {
    expect(
      computeUserAudience({
        person,
        activeCampaignIdsMatchingUser: ['a'],
        adminIdsByCampaignId: admins,
        now: NOW,
      }),
    ).toEqual({ visibleToMemberIds: [], candidateCampaignIds: [] });
  });

  it('is available again the moment the cooldown ends', () => {
    expect(
      computeUserAudience({
        person: { ...available, cooldownUntil: '2026-03-10T12:00:00Z' },
        activeCampaignIdsMatchingUser: ['a'],
        adminIdsByCampaignId: admins,
        now: NOW,
      }).visibleToMemberIds,
    ).toEqual(['m1', 'm2']);
  });
});
