import {
  MAX_ATTEMPTS,
  type PlatformEventType,
} from 'src/constants/platform-events.constant';
import { upsertContact } from 'src/logic-functions/utils/contact-upserted.util';
import { type PlatformEvent } from 'src/logic-functions/utils/parse-platform-envelope.util';
import {
  updateRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

export type InboxRow = {
  id: string;
  attempts: number;
  payload: PlatformEvent;
};

type EventHandler = (client: RecordsClient, event: PlatformEvent) => Promise<'processed' | 'waiting'>;

// Types without a handler stay Received; the sweeper skips them until their ticket registers one.
const EVENT_HANDLERS: Partial<Record<PlatformEventType, EventHandler>> = {
  'contact.upserted': async (client, event) => {
    await upsertContact(client, event);

    return 'processed';
  },
};

export const HANDLED_EVENT_TYPES = Object.keys(EVENT_HANDLERS);

export const processInboxRow = async (
  client: RecordsClient,
  row: InboxRow,
  now: Date,
): Promise<void> => {
  const handler = EVENT_HANDLERS[row.payload.type];

  if (!handler) {
    return;
  }

  try {
    const outcome = await handler(client, row.payload);

    await updateRecord(
      client,
      'PlatformEventInbox',
      row.id,
      outcome === 'processed'
        ? { status: 'PROCESSED', attempts: row.attempts + 1, processedAt: now.toISOString(), lastError: null }
        : { status: 'WAITING_FOR_CONTACT' },
    );
  } catch (error) {
    const attempts = row.attempts + 1;

    await updateRecord(client, 'PlatformEventInbox', row.id, {
      status: 'FAILED',
      attempts,
      lastError: (error instanceof Error ? error.message : String(error)).slice(0, 500),
      needsReview: attempts >= MAX_ATTEMPTS,
    });
  }
};
