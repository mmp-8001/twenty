import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import {
  SWEEP_CRON_PATTERN,
  SWEEP_ROUTE_PATH,
} from 'src/constants/proopco-jobs.constant';
import { PROOPCO_SYNC_TOKEN_HEADER } from 'src/constants/proopco-sync.constant';
import { PROOPCO_SWEEP_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  MissingSettingError,
  readPoolDays,
} from 'src/logic-functions/utils/read-app-settings.util';
import { readJobInput } from 'src/logic-functions/utils/read-job-request.util';
import { sweepFollowups } from 'src/logic-functions/utils/sweep-followups.util';

export const sweepFollowupsHandler = async (payload: unknown) => {
  const request = readJobInput<{ referenceDate: string }>(payload);

  if ('error' in request) {
    return { success: false, error: request.error };
  }

  try {
    const { updated } = await sweepFollowups({
      client: new CoreApiClient({ runAs: 'application' }),
      referenceDate: new Date(request.input.referenceDate ?? Date.now()),
      poolDays: readPoolDays(),
    });

    return { success: true, updated };
  } catch (error) {
    if (error instanceof MissingSettingError) {
      return { success: false, error: error.message };
    }

    throw error;
  }
};

export default defineLogicFunction({
  universalIdentifier: PROOPCO_SWEEP_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-sweep-followups',
  description:
    'Expires overdue Followups and moves overdue Retry Pending ones to the Pool.',
  timeoutSeconds: 120,
  handler: sweepFollowupsHandler,
  cronTriggerSettings: { pattern: SWEEP_CRON_PATTERN },
  // The route lets tests pass a referenceDate; the cron uses the clock.
  httpRouteTriggerSettings: {
    path: SWEEP_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: [PROOPCO_SYNC_TOKEN_HEADER],
  },
});
