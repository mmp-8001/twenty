import { describe, expect, it } from 'vitest';

import {
  buildPersonFields,
  isStaleSnapshot,
} from 'src/logic-functions/utils/contact-upserted.util';

const snapshot = {
  platformUserId: 'u_1',
  updatedAt: '2026-11-14T06:30:00.000Z',
  firstName: 'Ali',
  lastName: 'Rezaei',
  phone: '+989121234567',
  email: 'ali@example.com',
  signupAt: '2025-03-02T10:15:00.000Z',
  hasPhone: true,
  country: 'IR',
  registrationSource: 'website',
  kycStatus: 'confirmed',
  birthDate: '1994-06-21',
  activeAccountCount: 2,
  purchaseCount: 3,
  lastPurchaseAt: '2026-10-30T12:00:00.000Z',
  totalPaidUsdt: '1250.005',
  currentStage: 'step_2',
  lastChallengeFailedAt: null,
  failedChallengeCount: 1,
  hasProfitWithdrawal: false,
  isReferred: true,
};

describe('buildPersonFields', () => {
  it('maps the snapshot onto Person fields', () => {
    expect(buildPersonFields(snapshot)).toMatchObject({
      name: { firstName: 'Ali', lastName: 'Rezaei' },
      phones: { primaryPhoneNumber: '9121234567', primaryPhoneCallingCode: '+98' },
      registrationSource: 'WEBSITE',
      kycStatus: 'CONFIRMED',
      currentStage: 'STEP_2',
      totalPaidUsdt: 1250.01,
      lastChallengeFailedAt: null,
    });
  });

  it('leaves lastLoginAt out unless the snapshot carries it', () => {
    expect(buildPersonFields(snapshot)).not.toHaveProperty('lastLoginAt');
    expect(buildPersonFields({ ...snapshot, lastLoginAt: null })).toHaveProperty('lastLoginAt', null);
  });

  it('rejects an unknown enum value', () => {
    expect(() => buildPersonFields({ ...snapshot, kycStatus: 'maybe' })).toThrow('kycStatus');
  });
});

describe('isStaleSnapshot', () => {
  it('ignores only strictly older snapshots', () => {
    expect(isStaleSnapshot('2026-11-14T07:00:00.000Z', '2026-11-14T06:30:00.000Z')).toBe(true);
    expect(isStaleSnapshot('2026-11-14T06:30:00.000Z', '2026-11-14T06:30:00.000Z')).toBe(false);
    expect(isStaleSnapshot(null, '2026-11-14T06:30:00.000Z')).toBe(false);
  });
});
