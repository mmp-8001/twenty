import { defineLogicFunction } from 'twenty-sdk/define';

import { ON_AGENT_CHANGE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { queueEligibilityRefresh } from 'src/logic-functions/utils/queue-eligibility-refresh.util';

export default defineLogicFunction({
  universalIdentifier: ON_AGENT_CHANGE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'on-agent-change',
  description: 'Queues one eligibility pass when an agent changes.',
  timeoutSeconds: 30,
  handler: queueEligibilityRefresh,
  databaseEventTriggerSettings: {
    eventName: 'agent.*',
    updatedFields: ['isActive', 'frozenSince'],
  },
});
