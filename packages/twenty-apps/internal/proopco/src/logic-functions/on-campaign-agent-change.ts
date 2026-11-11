import { defineLogicFunction } from 'twenty-sdk/define';

import { ON_CAMPAIGN_AGENT_CHANGE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { refreshEligibilityNow } from 'src/logic-functions/utils/refresh-eligibility-now.util';

export default defineLogicFunction({
  universalIdentifier: ON_CAMPAIGN_AGENT_CHANGE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'on-campaign-agent-change',
  description: 'Recomputes eligibility when a campaign-agent changes.',
  timeoutSeconds: 300,
  handler: refreshEligibilityNow,
  databaseEventTriggerSettings: {
    eventName: 'campaignAgent.*',
  },
});
