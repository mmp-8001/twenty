import { describe, expect, it } from 'vitest';

import {
  signPlatformBody,
  verifyPlatformSignature,
} from 'src/logic-functions/utils/platform-signature.util';

const SECRET = 'test-secret';
const NOW = new Date('2026-11-14T06:30:00.000Z');
const TIMESTAMP = String(NOW.getTime() / 1000);
const BODY = '{"events":[]}';

const verify = (overrides: Partial<Parameters<typeof verifyPlatformSignature>[0]> = {}) =>
  verifyPlatformSignature({
    secret: SECRET,
    timestamp: TIMESTAMP,
    signature: signPlatformBody(SECRET, TIMESTAMP, BODY),
    rawBody: BODY,
    now: NOW,
    ...overrides,
  });

describe('platform contract worked example', () => {
  it('signs the documented body to the documented signature', () => {
    const body =
      '{"events":[{"eventId":"0b7f3c1e-6a2d-4e8a-9a51-2f1d3c9e7a10","type":"account.last_lost","schemaVersion":"1.0","occurredAt":"2026-11-14T06:30:00.000Z","data":{"platformUserId":"u_48213"}}]}';

    expect(signPlatformBody(SECRET, '1794637800', body)).toBe(
      'sha256=177ed1a6e4f054d56dd0820209dcd7f039f12247877b54069bbda770a935dee3',
    );
  });
});

describe('verifyPlatformSignature', () => {
  it('accepts a valid signature', () => {
    expect(verify()).toBe(true);
  });

  it('refuses a wrong secret, a changed body and a malformed signature', () => {
    expect(verify({ secret: 'other' })).toBe(false);
    expect(verify({ rawBody: `${BODY} ` })).toBe(false);
    expect(verify({ signature: 'sha256=abc' })).toBe(false);
  });

  it('refuses an empty or missing secret and missing headers', () => {
    expect(verify({ secret: '' })).toBe(false);
    expect(verify({ secret: undefined })).toBe(false);
    expect(verify({ timestamp: undefined })).toBe(false);
    expect(verify({ signature: undefined })).toBe(false);
    expect(verify({ rawBody: undefined })).toBe(false);
  });

  it('allows 5 minutes of skew either way and refuses more', () => {
    const at = (offsetSeconds: number) => {
      const timestamp = String(NOW.getTime() / 1000 + offsetSeconds);

      return verify({ timestamp, signature: signPlatformBody(SECRET, timestamp, BODY) });
    };

    expect(at(-300)).toBe(true);
    expect(at(300)).toBe(true);
    expect(at(-301)).toBe(false);
    expect(at(301)).toBe(false);
  });
});
