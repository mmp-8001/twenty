import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import { PLATFORM_EVENT_SWEEPER_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { processPendingInbox } from 'src/logic-functions/utils/process-pending-inbox.util';
import { reconcileClaims } from 'src/logic-functions/utils/reconcile-claims.util';
import { type RecordsClient } from 'src/logic-functions/utils/records.util';

// Steps for later tickets (deadlines, rollups) join here; each takes `now`.
export const runSweeper = async (
  now: Date,
  client: RecordsClient = new CoreApiClient({ runAs: 'application' }),
) => ({
  processedInboxRows: await processPendingInbox(client, now),
  releasedClaims: await reconcileClaims(client, now),
});

export default defineLogicFunction({
  universalIdentifier:
    PLATFORM_EVENT_SWEEPER_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'platform-event-sweeper',
  description: 'Every minute: retries Failed and Waiting platform events and releases claims that lost their deal.',
  timeoutSeconds: 55,
  handler: () => runSweeper(new Date()),
  cronTriggerSettings: { pattern: '* * * * *' },
});
