import { describe, expect, it } from 'vitest';

import { getCodeServiceProvider } from 'src/logic-functions/utils/code-service/get-code-service-provider';
import {
  buildActivationKey,
  buildOfferSmsBody,
  buildSmsSourceRef,
  decideActivation,
  describeActivation,
  isOfferExpired,
} from 'src/utils/offer-activation.util';

const NOW = new Date('2026-11-07T12:00:00Z');
const liveOffer = { status: 'ACTIVE', expiresAt: '2026-12-01T00:00:00Z' };
const decide = (overrides: Partial<Parameters<typeof decideActivation>[0]> = {}) =>
  decideActivation({
    isOwner: true,
    isCallAnswered: true,
    offer: liveOffer,
    existingStatus: null,
    now: NOW,
    ...overrides,
  });

describe('offer activation rules', () => {
  it('builds stable keys', () => {
    expect(buildActivationKey('o1', 'p1')).toBe('o1:p1');
    expect(buildSmsSourceRef('a1')).toBe('offer-activation:a1');
  });

  it('expires at the fixed instant', () => {
    expect(isOfferExpired('2026-11-07T12:00:00Z', NOW)).toBe(true);
    expect(isOfferExpired('2026-11-07T12:00:01Z', NOW)).toBe(false);
  });

  it('puts code, capability and expiry in the SMS', () => {
    expect(buildOfferSmsBody({ code: 'ABC', capability: 'RESET', expiresAt: '2026-12-01T00:00:00Z' })).toBe(
      'Your Proopco code: ABC (reset), valid until 2026-12-01 00:00 UTC',
    );
  });

  it.each([
    [{}, null],
    [{ isOwner: false }, 'NOT_OWNER'],
    [{ isCallAnswered: false }, 'CALL_NOT_ANSWERED'],
    [{ offer: null }, 'OFFER_UNAVAILABLE'],
    [{ offer: { ...liveOffer, status: 'DEACTIVATED' } }, 'OFFER_UNAVAILABLE'],
    [{ offer: { ...liveOffer, expiresAt: '2026-11-06T00:00:00Z' } }, 'OFFER_UNAVAILABLE'],
    [{ existingStatus: 'ACTIVE' }, 'ALREADY_ACTIVE'],
    [{ existingStatus: 'USED' }, 'ALREADY_ACTIVE'],
    [{ existingStatus: 'ACTIVATING' }, 'ALREADY_ACTIVE'],
    [{ existingStatus: 'ACTIVATION_FAILED' }, null],
  ] as const)('decides %j as %s', (overrides, expected) => {
    expect(decide(overrides)).toBe(expected);
  });

  it('describes each state and its button', () => {
    const base = { status: 'ACTIVE', smsStatus: 'SENT', expiresAt: '2026-12-01T00:00:00Z', deactivatedAt: null };

    expect(describeActivation(base)).toEqual({
      label: 'Active for this user until 2026-12-01 00:00 UTC',
      action: null,
    });
    expect(describeActivation({ ...base, smsStatus: 'FAILED' }).action).toBe('RESEND_SMS');
    expect(describeActivation({ ...base, status: 'ACTIVATION_FAILED' }).action).toBe('RETRY');
    expect(describeActivation({ ...base, status: 'DEACTIVATED', deactivatedAt: '2026-11-07T01:00:00Z' }).label).toBe(
      'Deactivated by Full Admin, 2026-11-07',
    );
  });

  it('refuses an unknown or unset code service provider', () => {
    expect(() => getCodeServiceProvider(undefined)).toThrow('Unknown code service provider');
    expect(() => getCodeServiceProvider('nope')).toThrow('Unknown code service provider');
    expect(getCodeServiceProvider('fake')).toBeDefined();
  });
});
