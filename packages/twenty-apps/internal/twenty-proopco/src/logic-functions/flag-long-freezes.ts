import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import {
  FLAG_LONG_FREEZES_CRON_PATTERN,
  FLAG_LONG_FREEZES_ROUTE_PATH,
} from 'src/constants/admin-management.constant';
import { PROOPCO_SYNC_TOKEN_HEADER } from 'src/constants/proopco-sync.constant';
import { FLAG_LONG_FREEZES_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { flagLongFreezes } from 'src/logic-functions/utils/flag-long-freezes.util';
import { readJobInput } from 'src/logic-functions/utils/read-job-request.util';

export const flagLongFreezesHandler = async (payload: unknown) => {
  const request = readJobInput<{ referenceDate: string }>(payload);

  if ('error' in request) {
    return { success: false, error: request.error };
  }

  return {
    success: true,
    ...(await flagLongFreezes({
      client: new CoreApiClient({ runAs: 'application' }),
      now: new Date(request.input.referenceDate ?? Date.now()),
    })),
  };
};

export default defineLogicFunction({
  universalIdentifier: FLAG_LONG_FREEZES_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-flag-long-freezes',
  description: 'Daily: flags Agent freezes that reached day 7.',
  timeoutSeconds: 60,
  handler: flagLongFreezesHandler,
  cronTriggerSettings: { pattern: FLAG_LONG_FREEZES_CRON_PATTERN },
  // The route lets tests pass a referenceDate; the cron uses the clock.
  httpRouteTriggerSettings: {
    path: FLAG_LONG_FREEZES_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: [PROOPCO_SYNC_TOKEN_HEADER],
  },
});
