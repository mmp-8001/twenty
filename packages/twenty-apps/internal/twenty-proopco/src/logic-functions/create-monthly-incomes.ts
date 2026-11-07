import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import {
  CREATE_MONTHLY_INCOMES_CRON_PATTERN,
  CREATE_MONTHLY_INCOMES_ROUTE_PATH,
} from 'src/constants/income-report.constant';
import { PROOPCO_SYNC_TOKEN_HEADER } from 'src/constants/proopco-sync.constant';
import { CREATE_MONTHLY_INCOMES_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { createMonthlyIncomes } from 'src/logic-functions/utils/create-monthly-incomes.util';
import { readJobInput } from 'src/logic-functions/utils/read-job-request.util';
import { isFirstJalaliDay } from 'src/utils/jalali.util';

export const createMonthlyIncomesHandler = async (payload: unknown) => {
  const request = readJobInput<{ referenceDate: string }>(payload);

  if ('error' in request) {
    return { success: false, error: request.error };
  }

  const now = new Date(request.input.referenceDate ?? Date.now());

  // The cron ticks every few minutes; only a first Jalali day does work. A route call names its own date.
  if (!request.input.referenceDate && !isFirstJalaliDay(now)) {
    return { success: true, skipped: true };
  }

  return {
    success: true,
    ...(await createMonthlyIncomes({ client: new CoreApiClient({ runAs: 'application' }), now })),
  };
};

export default defineLogicFunction({
  universalIdentifier: CREATE_MONTHLY_INCOMES_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-create-monthly-incomes',
  description: 'On the first Jalali day, rolls the previous month Commissions into one pending income per Agent.',
  timeoutSeconds: 120,
  handler: createMonthlyIncomesHandler,
  cronTriggerSettings: { pattern: CREATE_MONTHLY_INCOMES_CRON_PATTERN },
  httpRouteTriggerSettings: {
    path: CREATE_MONTHLY_INCOMES_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: [PROOPCO_SYNC_TOKEN_HEADER],
  },
});
