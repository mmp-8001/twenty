import { describe, expect, it } from 'vitest';

import { parsePlatformEnvelope } from 'src/logic-functions/utils/parse-platform-envelope.util';

const event = (overrides: Record<string, unknown> = {}) => ({
  eventId: 'e1',
  type: 'account.last_lost',
  schemaVersion: '1.0',
  occurredAt: '2026-11-14T06:30:00.000Z',
  data: { platformUserId: 'u_1' },
  ...overrides,
});

const parse = (events: unknown[]) =>
  parsePlatformEnvelope(JSON.stringify({ events }));

describe('parsePlatformEnvelope', () => {
  it('accepts a valid batch, including a newer minor version', () => {
    expect(parse([event(), event({ eventId: 'e2', schemaVersion: '1.7' })])).toMatchObject({ ok: true });
  });

  it('refuses an unknown major version with 422', () => {
    expect(parse([event({ schemaVersion: '2.0' })])).toMatchObject({ ok: false, status: 422 });
  });

  it.each([
    ['not json', 'nope'],
    ['no events', JSON.stringify({ events: [] })],
    ['501 events', JSON.stringify({ events: Array.from({ length: 501 }, () => event()) })],
  ])('refuses %s with 400', (_label, body) => {
    expect(parsePlatformEnvelope(body)).toMatchObject({ ok: false, status: 400 });
  });

  it.each([
    ['unknown type', { type: 'refund.created' }],
    ['missing eventId', { eventId: '' }],
    ['bad date', { occurredAt: 'yesterday' }],
    ['bad version', { schemaVersion: 'one' }],
    ['no data', { data: null }],
  ])('refuses an event with %s', (_label, overrides) => {
    expect(parse([event(overrides)])).toMatchObject({ ok: false, status: 400 });
  });
});
