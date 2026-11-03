import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import { MONTHLY_INCOME_ROUTE_PATH } from 'src/constants/proopco-jobs.constant';
import { PROOPCO_SYNC_TOKEN_HEADER } from 'src/constants/proopco-sync.constant';
import { PROOPCO_MONTHLY_INCOME_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { previousMonthOf } from 'src/logic-functions/utils/commission-rules.util';
import { createMonthlyIncomes } from 'src/logic-functions/utils/create-monthly-incomes.util';
import { readJobInput } from 'src/logic-functions/utils/read-job-request.util';

export const createMonthlyIncomesHandler = async (payload: unknown) => {
  const request = readJobInput<{ month: string }>(payload);

  if ('error' in request) {
    return { success: false, error: request.error };
  }

  const result = await createMonthlyIncomes({
    client: new CoreApiClient({ runAs: 'application' }),
    month: request.input.month ?? previousMonthOf(new Date()),
  });

  return { success: true, ...result };
};

export default defineLogicFunction({
  universalIdentifier:
    PROOPCO_MONTHLY_INCOME_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-create-monthly-incomes',
  description: "Sums each agent's Commissions of a month into a Monthly Income.",
  timeoutSeconds: 120,
  handler: createMonthlyIncomesHandler,
  workflowActionTriggerSettings: { label: 'Create Monthly Incomes' },
  httpRouteTriggerSettings: {
    path: MONTHLY_INCOME_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: [PROOPCO_SYNC_TOKEN_HEADER],
  },
});
