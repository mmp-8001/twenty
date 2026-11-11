import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import {
  MAX_ATTEMPTS,
  type PlatformEventType,
} from 'src/constants/platform-events.constant';
import { upsertContact } from 'src/logic-functions/utils/contact-upserted.util';
import {
  loadEligibilityPlan,
  recomputeContactEligibility,
} from 'src/logic-functions/utils/eligibility.util';
import { processAccountLastLost } from 'src/logic-functions/utils/process-last-lost.util';
import { processPurchase } from 'src/logic-functions/utils/process-purchase.util';
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

export type EventOutcome = 'processed' | 'waiting' | 'needsReview';

type EventHandler = (client: RecordsClient, event: PlatformEvent, now: Date) => Promise<EventOutcome>;

// Types without a handler stay Received; the sweeper skips them.
const EVENT_HANDLERS: Partial<Record<PlatformEventType, EventHandler>> = {
  'contact.upserted': async (client, event) => {
    const personId = await upsertContact(client, event);

    await recomputeContactEligibility(
      client,
      await loadEligibilityPlan(client, new MetadataApiClient({ runAs: 'application' })),
      personId,
    );

    return 'processed';
  },
  'purchase.settled': processPurchase,
  'account.last_lost': processAccountLastLost,
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
    const outcome = await handler(client, row.payload, now);

    await updateRecord(
      client,
      'PlatformEventInbox',
      row.id,
      outcome === 'waiting'
        ? { status: 'WAITING_FOR_CONTACT' }
        : {
            status: 'PROCESSED',
            attempts: row.attempts + 1,
            processedAt: now.toISOString(),
            lastError: null,
            needsReview: outcome === 'needsReview',
          },
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
