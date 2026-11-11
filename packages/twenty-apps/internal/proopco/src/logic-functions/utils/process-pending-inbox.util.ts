import {
  MAX_ATTEMPTS,
  SWEEPER_BATCH_SIZE,
} from 'src/constants/platform-events.constant';
import {
  HANDLED_EVENT_TYPES,
  processInboxRow,
  type InboxRow,
} from 'src/logic-functions/utils/process-inbox-row.util';
import {
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

const INBOX_ROW_SELECTION = { attempts: true, payload: true };

export const processPendingInbox = async (
  client: RecordsClient,
  now: Date,
): Promise<number> => {
  const rows = await listRecords<InboxRow>(
    client,
    'platformEventInboxes',
    {
      status: { in: ['RECEIVED', 'WAITING_FOR_CONTACT', 'FAILED'] },
      attempts: { lt: MAX_ATTEMPTS },
      eventType: { in: HANDLED_EVENT_TYPES },
    },
    INBOX_ROW_SELECTION,
    SWEEPER_BATCH_SIZE,
  );

  for (const row of rows) {
    await processInboxRow(client, row, now);
  }

  return rows.length;
};
