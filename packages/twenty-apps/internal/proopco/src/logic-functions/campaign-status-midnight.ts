import { defineLogicFunction } from 'twenty-sdk/define';

import { CAMPAIGN_STATUS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { refreshEligibilityNow } from 'src/logic-functions/utils/refresh-eligibility-now.util';

// Container time is UTC, so 20:30 is Tehran midnight.
export default defineLogicFunction({
  universalIdentifier: CAMPAIGN_STATUS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'campaign-status-midnight',
  description: 'At Tehran midnight: moves campaign status and recomputes eligibility.',
  timeoutSeconds: 300,
  handler: refreshEligibilityNow,
  cronTriggerSettings: { pattern: '30 20 * * *' },
});
