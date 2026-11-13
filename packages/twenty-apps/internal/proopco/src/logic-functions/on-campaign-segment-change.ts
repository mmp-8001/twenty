import { defineLogicFunction } from 'twenty-sdk/define';

import { ON_CAMPAIGN_SEGMENT_CHANGE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { queueEligibilityRefresh } from 'src/logic-functions/utils/queue-eligibility-refresh.util';

export default defineLogicFunction({
  universalIdentifier: ON_CAMPAIGN_SEGMENT_CHANGE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'on-campaign-segment-change',
  description: 'Queues one eligibility pass when a campaign-segment changes.',
  timeoutSeconds: 30,
  handler: queueEligibilityRefresh,
  databaseEventTriggerSettings: {
    eventName: 'campaignSegment.*',
  },
});
