import { defineLogicFunction } from 'twenty-sdk/define';

import {
  RECOMPUTE_VISIBILITY_CRON_PATTERN,
  RECOMPUTE_VISIBILITY_ROUTE_PATH,
} from 'src/constants/proopco-jobs.constant';
import { PROOPCO_SYNC_TOKEN_HEADER } from 'src/constants/proopco-sync.constant';
import {
  RECOMPUTE_VISIBILITY_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { readJobInput } from 'src/logic-functions/utils/read-job-request.util';
import { recomputeAllVisibility } from 'src/logic-functions/utils/recompute-visibility.util';

export const recomputeVisibilityHandler = async (payload: unknown) => {
  const request = readJobInput<{ referenceDate: string }>(payload);

  if ('error' in request) {
    return { success: false, error: request.error };
  }

  return { success: true, ...(await recomputeAllVisibility(request.input.referenceDate)) };
};

export default defineLogicFunction({
  universalIdentifier: RECOMPUTE_VISIBILITY_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-recompute-visibility',
  description:
    'Rewrites every User list from the active Campaigns, their Segments and Agents.',
  timeoutSeconds: 300,
  handler: recomputeVisibilityHandler,
  cronTriggerSettings: { pattern: RECOMPUTE_VISIBILITY_CRON_PATTERN },
  // The route lets tests pass a referenceDate; the cron uses the clock.
  httpRouteTriggerSettings: {
    path: RECOMPUTE_VISIBILITY_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: [PROOPCO_SYNC_TOKEN_HEADER],
  },
});

