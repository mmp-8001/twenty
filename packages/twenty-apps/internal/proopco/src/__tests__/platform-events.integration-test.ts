import { randomUUID } from 'crypto';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_ATTEMPTS } from 'src/constants/platform-events.constant';
import { runSweeper } from 'src/logic-functions/platform-event-sweeper';
import { handlePlatformEvents } from 'src/logic-functions/platform-events-route';
import { signPlatformBody } from 'src/logic-functions/utils/platform-signature.util';
import {
  createRecord,
  listRecords,
  updateRecord,
} from 'src/logic-functions/utils/records.util';

import { assertInvariants } from './assert-invariants';
import { TEST_HMAC_SECRET } from './test-constants';

const client = new CoreApiClient();
const ROUTE_URL = `${process.env.TWENTY_API_URL}/s/platform/events`;

type InboxRow = {
  id: string;
  eventId: string;
  status: string;
  attempts: number;
  needsReview: boolean;
  lastError: string | null;
};
type PersonRow = {
  id: string;
  platformUserId: string;
  platformUpdatedAt: string;
  kycStatus: string | null;
  lastLoginAt: string | null;
  name: { firstName: string; lastName: string };
};

let usedEventIds: string[] = [];
let usedPlatformUserIds: string[] = [];

const newUserId = () => {
  const id = `u_${randomUUID()}`;

  usedPlatformUserIds.push(id);

  return id;
};

const contactEvent = (
  platformUserId: string,
  updatedAt: string,
  dataOverrides: Record<string, unknown> = {},
  eventId = randomUUID(),
) => {
  usedEventIds.push(eventId);

  return {
    eventId,
    type: 'contact.upserted',
    schemaVersion: '1.0',
    occurredAt: updatedAt,
    data: {
      platformUserId,
      updatedAt,
      firstName: 'Ali',
      lastName: 'Rezaei',
      phone: '+989121234567',
      email: `${platformUserId}@example.com`,
      signupAt: '2025-03-02T10:15:00.000Z',
      hasPhone: true,
      country: 'IR',
      registrationSource: 'website',
      kycStatus: 'confirmed',
      birthDate: '1994-06-21',
      activeAccountCount: 2,
      purchaseCount: 3,
      lastPurchaseAt: '2026-10-30T12:00:00.000Z',
      totalPaidUsdt: '1250.00',
      currentStage: 'step_2',
      lastChallengeFailedAt: null,
      failedChallengeCount: 1,
      hasProfitWithdrawal: false,
      isReferred: true,
      ...dataOverrides,
    },
  };
};

const sign = (events: unknown[], at = new Date()) => {
  const rawBody = JSON.stringify({ events });
  const timestamp = String(Math.floor(at.getTime() / 1000));

  return {
    rawBody,
    headers: {
      'x-proopco-timestamp': timestamp,
      'x-proopco-signature': signPlatformBody(TEST_HMAC_SECRET, timestamp, rawBody),
    },
  };
};

const postToDeployedRoute = (signed: ReturnType<typeof sign>) =>
  fetch(ROUTE_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...signed.headers },
    body: signed.rawBody,
  });

const callHandler = (signed: ReturnType<typeof sign>, now = new Date()) =>
  handlePlatformEvents(
    { ...signed, headers: signed.headers } as never,
    now,
    client,
  );

const inboxRows = (eventIds: string[]) =>
  listRecords<InboxRow>(
    client,
    'platformEventInboxes',
    { eventId: { in: eventIds } },
    { eventId: true, status: true, attempts: true, needsReview: true, lastError: true },
  );

const findPerson = async (platformUserId: string) =>
  (
    await listRecords<PersonRow>(
      client,
      'people',
      { platformUserId: { eq: platformUserId } },
      { platformUserId: true, platformUpdatedAt: true, kycStatus: true, lastLoginAt: true, name: { firstName: true, lastName: true } },
    )
  )[0];

beforeEach(() => {
  usedEventIds = [];
  usedPlatformUserIds = [];
  vi.stubEnv('PLATFORM_HMAC_SECRET', TEST_HMAC_SECRET);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await assertInvariants(client);

  for (const { id } of await inboxRows(usedEventIds)) {
    await client.mutation({ deletePlatformEventInbox: { __args: { id }, id: true } });
  }

  for (const platformUserId of usedPlatformUserIds) {
    const person = await findPerson(platformUserId);

    if (person) {
      await client.mutation({ deletePerson: { __args: { id: person.id }, id: true } });
    }
  }
});

describe('deployed route', () => {
  it('stores a signed contact event, answers 200 and creates the Person', async () => {
    const userId = newUserId();
    const event = contactEvent(userId, '2026-11-14T06:30:00.000Z');

    const response = await postToDeployedRoute(sign([event]));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ accepted: 1, duplicates: 0 });
    expect((await inboxRows([event.eventId]))[0]).toMatchObject({ status: 'PROCESSED' });
    expect(await findPerson(userId)).toMatchObject({
      platformUserId: userId,
      kycStatus: 'CONFIRMED',
      name: { firstName: 'Ali', lastName: 'Rezaei' },
    });
  });

  it('keeps one inbox row when the same event arrives 20 times at once', async () => {
    const event = contactEvent(newUserId(), '2026-11-14T06:30:00.000Z');
    const signed = sign([event]);

    const responses = await Promise.all(
      Array.from({ length: 20 }, () => postToDeployedRoute(signed)),
    );

    expect(responses.map(({ status }) => status)).toEqual(Array(20).fill(200));
    expect(await inboxRows([event.eventId])).toHaveLength(1);
  });

  it('refuses a bad signature, a stale timestamp and an unknown major version', async () => {
    const event = contactEvent(newUserId(), '2026-11-14T06:30:00.000Z');
    const signed = sign([event]);
    const stale = sign([event], new Date(Date.now() - 10 * 60 * 1000));
    const futureMajor = sign([{ ...event, schemaVersion: '2.0' }]);

    expect((await postToDeployedRoute({ ...signed, headers: { ...signed.headers, 'x-proopco-signature': 'sha256=00' } })).status).toBe(401);
    expect((await postToDeployedRoute(stale)).status).toBe(401);
    expect((await postToDeployedRoute(futureMajor)).status).toBe(422);
    expect(await inboxRows([event.eventId])).toHaveLength(0);
  });
});

describe('handler under a controlled clock', () => {
  it('refuses everything when the secret is not configured', async () => {
    vi.stubEnv('PLATFORM_HMAC_SECRET', '');
    const event = contactEvent(newUserId(), '2026-11-14T06:30:00.000Z');

    expect((await callHandler(sign([event]))).status).toBe(401);
    expect(await inboxRows([event.eventId])).toHaveLength(0);
  });

  it('refuses a signature 5 minutes and 1 second away from the injected clock', async () => {
    const event = contactEvent(newUserId(), '2026-11-14T06:30:00.000Z');
    const signedAt = new Date('2026-11-14T06:30:00.000Z');

    expect((await callHandler(sign([event], signedAt), new Date('2026-11-14T06:35:00.000Z'))).status).toBe(200);
    expect((await callHandler(sign([event], signedAt), new Date('2026-11-14T06:35:01.000Z'))).status).toBe(401);
  });

  it('ignores a snapshot older than the stored one and applies a newer one', async () => {
    const userId = newUserId();
    const now = new Date();

    await callHandler(sign([contactEvent(userId, '2026-11-14T06:30:00.000Z')]), now);
    await callHandler(sign([contactEvent(userId, '2026-11-14T06:00:00.000Z', { kycStatus: 'rejected' })]), now);

    expect(await findPerson(userId)).toMatchObject({ kycStatus: 'CONFIRMED' });

    await callHandler(sign([contactEvent(userId, '2026-11-14T07:00:00.000Z', { kycStatus: 'rejected' })]), now);

    expect(await findPerson(userId)).toMatchObject({ kycStatus: 'REJECTED' });
  });

  it('keeps lastLoginAt unless the snapshot carries it', async () => {
    const userId = newUserId();
    const now = new Date();

    await callHandler(sign([contactEvent(userId, '2026-11-14T06:30:00.000Z', { lastLoginAt: '2026-11-13T19:40:00.000Z' })]), now);
    await callHandler(sign([contactEvent(userId, '2026-11-14T07:00:00.000Z')]), now);

    expect((await findPerson(userId)).lastLoginAt).toBe('2026-11-13T19:40:00.000Z');
  });
});

describe('sweeper', () => {
  it('retries a Waiting row once its contact data is processable', async () => {
    const event = contactEvent(newUserId(), '2026-11-14T06:30:00.000Z');
    await createRecord(client, 'PlatformEventInbox', {
      eventId: event.eventId,
      eventType: event.type,
      platformUserId: event.data.platformUserId,
      occurredAt: event.occurredAt,
      payload: event,
      status: 'WAITING_FOR_CONTACT',
    });

    await runSweeper(new Date(), client);

    expect((await inboxRows([event.eventId]))[0]).toMatchObject({ status: 'PROCESSED' });
    expect(await findPerson(event.data.platformUserId)).toBeDefined();
  });

  it('leaves a Failed row for review after 5 attempts and stops retrying it', async () => {
    const event = contactEvent(newUserId(), '2026-11-14T06:30:00.000Z', { kycStatus: 'maybe' });

    expect((await callHandler(sign([event]))).status).toBe(200);
    expect((await inboxRows([event.eventId]))[0]).toMatchObject({ status: 'FAILED', attempts: 1, needsReview: false });

    for (let attempt = 2; attempt <= MAX_ATTEMPTS + 2; attempt += 1) {
      await runSweeper(new Date(), client);
    }

    expect((await inboxRows([event.eventId]))[0]).toMatchObject({
      status: 'FAILED',
      attempts: MAX_ATTEMPTS,
      needsReview: true,
    });
    expect((await inboxRows([event.eventId]))[0].lastError).toContain('kycStatus');
  });

  it('recovers a Failed row when a later retry succeeds', async () => {
    const event = contactEvent(newUserId(), '2026-11-14T06:30:00.000Z', { kycStatus: 'maybe' });

    await callHandler(sign([event]));
    const [row] = await inboxRows([event.eventId]);
    const fixed = contactEvent(event.data.platformUserId, '2026-11-14T06:30:00.000Z', {}, event.eventId);

    await updateRecord(client, 'PlatformEventInbox', row.id, { payload: fixed });
    await runSweeper(new Date(), client);

    expect((await inboxRows([event.eventId]))[0]).toMatchObject({ status: 'PROCESSED' });
  });
});
