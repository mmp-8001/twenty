import { type PlatformEvent } from 'src/logic-functions/utils/parse-platform-envelope.util';
import { type InboxRow } from 'src/logic-functions/utils/process-inbox-row.util';
import {
  createRecord,
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

export const findStoredEventIds = async (client: RecordsClient, eventIds: string[]) =>
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

// Returns null when the event is already stored.
export const storePlatformEvent = async (
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
