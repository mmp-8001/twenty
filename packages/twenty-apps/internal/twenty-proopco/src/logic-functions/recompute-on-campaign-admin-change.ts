import { defineLogicFunction } from 'twenty-sdk/define';

import { RECOMPUTE_ON_CAMPAIGN_ADMIN_CHANGE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { recomputeAllVisibility } from 'src/logic-functions/utils/recompute-visibility.util';

export const recomputeOnCampaignAdminChangeHandler = async () => ({
  success: true,
  ...(await recomputeAllVisibility()),
});

export default defineLogicFunction({
  universalIdentifier: RECOMPUTE_ON_CAMPAIGN_ADMIN_CHANGE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-recompute-on-campaign-admin-change',
  description: 'Recomputes the User lists when an Admin is assigned to or removed from a Campaign.',
  timeoutSeconds: 300,
  handler: recomputeOnCampaignAdminChangeHandler,
  databaseEventTriggerSettings: { eventName: 'campaignAdmin.*' },
});
