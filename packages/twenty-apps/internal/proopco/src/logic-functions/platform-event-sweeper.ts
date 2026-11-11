import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { defineLogicFunction } from 'twenty-sdk/define';

import { PLATFORM_EVENT_SWEEPER_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { failStalePendingActivations } from 'src/logic-functions/utils/code-activation.util';
import { closeExpiredDeals } from 'src/logic-functions/utils/close-expired-deals.util';
import { loadEligibilityPlan } from 'src/logic-functions/utils/eligibility.util';
import { processPendingInbox } from 'src/logic-functions/utils/process-pending-inbox.util';
import {
  markMissedSlots,
  refreshDealMirrors,
  releaseCooldowns,
} from 'src/logic-functions/utils/refresh-deal-state.util';
import { reconcileClaims } from 'src/logic-functions/utils/reconcile-claims.util';
import { type RecordsClient } from 'src/logic-functions/utils/records.util';
import { resumeAudits } from 'src/logic-functions/utils/resume-audits.util';

// Each step takes `now`.
export const runSweeper = async (
  now: Date,
  client: RecordsClient = new CoreApiClient({ runAs: 'application' }),
) => {
  const metadata = new MetadataApiClient({ runAs: 'application' });
  const plan = await loadEligibilityPlan(client, metadata);

  return {
    closedDeals: await closeExpiredDeals(client, plan, now),
    missedSlots: await markMissedSlots(client, now),
    releasedCooldowns: await releaseCooldowns(client, plan, now),
    rewrittenMirrors: await refreshDealMirrors(client, now),
    processedInboxRows: await processPendingInbox(client, now),
    resumedAudits: await resumeAudits({ client, metadata }, now),
    releasedClaims: await reconcileClaims(client, now),
    failedActivations: await failStalePendingActivations(client, now),
  };
};

export default defineLogicFunction({
  universalIdentifier:
    PLATFORM_EVENT_SWEEPER_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'platform-event-sweeper',
  description: 'Every minute: closes expired deals, marks missed slots, releases cool-downs, refreshes urgency, retries platform events, resumes stuck audit operations, releases orphaned claims and fails stuck code activations.',
  timeoutSeconds: 55,
  handler: () => runSweeper(new Date()),
  cronTriggerSettings: { pattern: '* * * * *' },
});
