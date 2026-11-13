import { defineLogicFunction } from 'twenty-sdk/define';

import { ELIGIBILITY_NIGHTLY_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { refreshEligibilityNow } from 'src/logic-functions/utils/refresh-eligibility-now.util';

// 23:30 UTC is ~03:00 Tehran, after the platform snapshot resend.
export default defineLogicFunction({
  universalIdentifier: ELIGIBILITY_NIGHTLY_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'eligibility-nightly',
  description: 'Nightly full eligibility pass.',
  timeoutSeconds: 300,
  handler: refreshEligibilityNow,
  cronTriggerSettings: { pattern: '30 23 * * *' },
});
