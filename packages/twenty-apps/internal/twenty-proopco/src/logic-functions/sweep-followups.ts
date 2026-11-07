import { defineLogicFunction } from 'twenty-sdk/define';

import {
  SWEEP_FOLLOWUPS_CRON_PATTERN,
  SWEEP_FOLLOWUPS_ROUTE_PATH,
} from 'src/constants/proopco-jobs.constant';
import { PROOPCO_SYNC_TOKEN_HEADER } from 'src/constants/proopco-sync.constant';
import { SWEEP_FOLLOWUPS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readJobInput } from 'src/logic-functions/utils/read-job-request.util';
import { sweepFollowupsWithApplicationClient } from 'src/logic-functions/utils/sweep-followups.util';

export const sweepFollowupsHandler = async (payload: unknown) => {
  const request = readJobInput<{ referenceDate: string }>(payload);

  if ('error' in request) {
    return { success: false, error: request.error };
  }

  return { success: true, ...(await sweepFollowupsWithApplicationClient(request.input.referenceDate)) };
};

export default defineLogicFunction({
  universalIdentifier: SWEEP_FOLLOWUPS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-sweep-followups',
  description:
    'Ends cases past their deadline, marks missed call windows and refreshes Users whose cooldown ended.',
  timeoutSeconds: 120,
  handler: sweepFollowupsHandler,
  cronTriggerSettings: { pattern: SWEEP_FOLLOWUPS_CRON_PATTERN },
  // The route lets tests pass a referenceDate; the cron uses the clock.
  httpRouteTriggerSettings: {
    path: SWEEP_FOLLOWUPS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: [PROOPCO_SYNC_TOKEN_HEADER],
  },
});
