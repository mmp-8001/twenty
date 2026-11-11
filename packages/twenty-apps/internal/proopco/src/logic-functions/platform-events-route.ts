import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import {
  INLINE_PROCESS_LIMIT,
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
} from 'src/constants/platform-events.constant';
import { PLATFORM_EVENTS_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  parsePlatformEnvelope,
  type PlatformEvent,
} from 'src/logic-functions/utils/parse-platform-envelope.util';
import { verifyPlatformSignature } from 'src/logic-functions/utils/platform-signature.util';
import {
  processInboxRow,
  type InboxRow,
} from 'src/logic-functions/utils/process-inbox-row.util';
import {
  createRecord,
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

const errorResponse = (status: number, code: string, message: string) =>
  new Response({ error: { code, message } }, { status });

const findStoredEventIds = async (client: RecordsClient, eventIds: string[]) =>
  new Set(
    (
      await listRecords<{ eventId: string }>(
        client,
        'platformEventInboxes',
        { eventId: { in: eventIds } },
        { eventId: true },
      )
    ).map(({ eventId }) => eventId),
  );

const storeEvent = async (
  client: RecordsClient,
  event: PlatformEvent,
): Promise<InboxRow | null> => {
  try {
    const id = await createRecord(client, 'PlatformEventInbox', {
      eventId: event.eventId,
      eventType: event.type,
      platformUserId: event.data.platformUserId,
      occurredAt: event.occurredAt,
      payload: event,
      status: 'RECEIVED',
    });

    return { id, attempts: 0, payload: event };
  } catch (error) {
    // A concurrent request may have stored the same eventId first: that is a duplicate, not a failure.
    if ((await findStoredEventIds(client, [event.eventId])).has(event.eventId)) {
      return null;
    }

    throw error;
  }
};

export const handlePlatformEvents = async (
  routePayload: RoutePayload<unknown>,
  now: Date,
  client: RecordsClient = new CoreApiClient({ runAs: 'application' }),
): Promise<Response> => {
  const { rawBody, headers } = routePayload;

  if (
    !verifyPlatformSignature({
      secret: process.env.PLATFORM_HMAC_SECRET,
      timestamp: headers?.[TIMESTAMP_HEADER],
      signature: headers?.[SIGNATURE_HEADER],
      rawBody,
      now,
    })
  ) {
    return errorResponse(401, 'BAD_SIGNATURE', 'Signature check failed');
  }

  const envelope = parsePlatformEnvelope(rawBody ?? '');

  if (!envelope.ok) {
    return errorResponse(envelope.status, envelope.code, envelope.message);
  }

  const alreadyStored = await findStoredEventIds(
    client,
    envelope.events.map(({ eventId }) => eventId),
  );
  const stored: InboxRow[] = [];
  let duplicates = 0;

  for (const event of envelope.events) {
    const row = alreadyStored.has(event.eventId)
      ? null
      : await storeEvent(client, event);

    if (row === null) {
      duplicates += 1;
    } else {
      stored.push(row);
      alreadyStored.add(event.eventId);
    }
  }

  // Stored first: a failure while processing never loses the event, the sweeper retries it.
  for (const row of stored.slice(0, INLINE_PROCESS_LIMIT)) {
    await processInboxRow(client, row, now);
  }

  return new Response({ accepted: stored.length, duplicates }, { status: 200 });
};

export default defineLogicFunction({
  universalIdentifier:
    PLATFORM_EVENTS_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'platform-events-route',
  description:
    'Receives signed platform events, stores them in the inbox and processes them.',
  timeoutSeconds: 30,
  handler: (routePayload: RoutePayload<unknown>) =>
    handlePlatformEvents(routePayload, new Date()),
  httpRouteTriggerSettings: {
    path: '/platform/events',
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: [TIMESTAMP_HEADER, SIGNATURE_HEADER],
  },
});
