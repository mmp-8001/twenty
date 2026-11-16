import { describe, expect, it } from 'vitest';

import { AWAITING_FIRST_CALL_DAYS, DAY_MS, FOLLOW_UP_DAYS } from 'src/constants/time.constant';
import { buildPersonFields } from 'src/logic-functions/utils/contact-upserted.util';
import {
  contactEventOf,
  platformUserIdOf,
  runIdOfPlatformUserId,
  SHOWCASE_CONTACT_COUNT,
  SHOWCASE_PLATFORM_USER_PREFIX,
  SHOWCASE_SCRIPTS,
  showcaseCountryOf,
  UNATTRIBUTED_PURCHASE_INDEX,
} from 'src/logic-functions/utils/showcase/showcase-data.util';

const CONTACTS_CREATED_AT = -45 * DAY_MS;

describe('showcase data', () => {
  it('builds contact events the real contact parser accepts, tagged with the run', () => {
    const now = new Date('2026-11-14T08:00:00.000Z');

    for (let index = 0; index < SHOWCASE_CONTACT_COUNT; index += 1) {
      const event = contactEventOf('ab12c', index, now);

      expect(() => buildPersonFields(event.data)).not.toThrow();
      expect(event.data.platformUserId).toBe(platformUserIdOf('ab12c', index));
      expect(String(event.data.country)).toContain('SHOWCASE-ab12c');
    }

    expect(runIdOfPlatformUserId(platformUserIdOf('ab12c', 7))).toBe('ab12c');
    expect(platformUserIdOf('ab12c', 7).startsWith(SHOWCASE_PLATFORM_USER_PREFIX)).toBe(true);
    expect(showcaseCountryOf('ab12c', 'A')).not.toBe(showcaseCountryOf('ab12c', 'B'));
  });

  it('keeps every script inside the deal clock the real Log call enforces', () => {
    for (const script of SHOWCASE_SCRIPTS) {
      let deadline = script.claimAt + AWAITING_FIRST_CALL_DAYS * DAY_MS;
      let previous = script.claimAt;

      expect(script.claimAt).toBeGreaterThan(CONTACTS_CREATED_AT);
      expect(script.index).toBeLessThan(SHOWCASE_CONTACT_COUNT);

      for (const call of script.calls) {
        expect(call.at).toBeGreaterThan(previous);
        expect(call.at).toBeLessThan(deadline);

        if (call.status === 'ANSWERED' && deadline === script.claimAt + AWAITING_FIRST_CALL_DAYS * DAY_MS) {
          deadline = call.at + FOLLOW_UP_DAYS * DAY_MS;
        }

        if ('nextAt' in call) {
          expect(call.nextAt).toBeGreaterThan(call.at);
          expect(call.nextAt).toBeLessThanOrEqual(deadline);
        }

        previous = call.at;
      }

      if (script.retentionCall && script.lastLostAt !== undefined) {
        expect(script.retentionCall.at).toBeLessThan(script.lastLostAt);
      }

      if (script.purchase) {
        expect(script.purchase.at).toBeGreaterThan(previous);
        expect(script.purchase.at).toBeLessThan(deadline);
      }
    }
  });

  it('leaves the unattributed buyer and a pool of contacts unclaimed', () => {
    const scripted = new Set(SHOWCASE_SCRIPTS.map(({ index }) => index));

    expect(scripted.has(UNATTRIBUTED_PURCHASE_INDEX)).toBe(false);
    expect(SHOWCASE_CONTACT_COUNT - scripted.size).toBeGreaterThanOrEqual(10);
  });
});
