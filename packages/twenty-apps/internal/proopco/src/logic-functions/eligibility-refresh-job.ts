import { defineLogicFunction } from 'twenty-sdk/define';

import { ELIGIBILITY_REFRESH_JOB_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { refreshEligibilityNow } from 'src/logic-functions/utils/refresh-eligibility-now.util';

export default defineLogicFunction({
  universalIdentifier: ELIGIBILITY_REFRESH_JOB_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'eligibility-refresh-job',
  description: 'Full eligibility pass, queued by the campaign, segment and agent triggers.',
  timeoutSeconds: 300,
  handler: refreshEligibilityNow,
});
