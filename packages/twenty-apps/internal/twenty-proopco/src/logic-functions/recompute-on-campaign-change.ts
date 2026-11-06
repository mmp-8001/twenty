import { defineLogicFunction } from 'twenty-sdk/define';

import { RECOMPUTE_ON_CAMPAIGN_CHANGE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { recomputeAllVisibility } from 'src/logic-functions/utils/recompute-visibility.util';

export const recomputeOnCampaignChangeHandler = async () => ({
  success: true,
  ...(await recomputeAllVisibility()),
});

export default defineLogicFunction({
  universalIdentifier: RECOMPUTE_ON_CAMPAIGN_CHANGE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-recompute-on-campaign-change',
  description: 'Recomputes the User lists when a Campaign is created or its audience changes.',
  timeoutSeconds: 300,
  handler: recomputeOnCampaignChangeHandler,
  // The recompute writes availableUserCount, which must not retrigger it.
  databaseEventTriggerSettings: {
    eventName: 'campaign.*',
    updatedFields: ['status', 'startsAt', 'endsAt', 'segmentViewId', 'cooldownDays'],
  },
});
