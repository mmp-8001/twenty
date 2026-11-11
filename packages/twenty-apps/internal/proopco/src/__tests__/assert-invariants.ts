import { CoreApiClient } from 'twenty-client-sdk/core';
import { expect } from 'vitest';

import { MAX_ATTEMPTS } from 'src/constants/platform-events.constant';
import { listRecords } from 'src/logic-functions/utils/records.util';

type InboxRow = {
  eventId: string;
  status: string;
  lastError: string | null;
  attempts: number;
  needsReview: boolean;
};

// Each ticket adds the invariants of the objects it introduces (PRD "Invariants" 1-10).
export const assertInvariants = async (client: CoreApiClient) => {
  const failed = await listRecords<InboxRow>(
    client,
    'platformEventInboxes',
    { status: { eq: 'FAILED' } },
    { eventId: true, status: true, lastError: true, attempts: true, needsReview: true },
  );

  for (const row of failed) {
    expect(row.lastError, `Failed event ${row.eventId} has a reason`).toBeTruthy();

    if (row.attempts >= MAX_ATTEMPTS) {
      expect(row.needsReview, `Failed event ${row.eventId} is flagged for review`).toBe(true);
    }
  }
};
