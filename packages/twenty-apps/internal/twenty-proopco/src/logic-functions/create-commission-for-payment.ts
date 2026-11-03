import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import { COMMISSION_ROUTE_PATH } from 'src/constants/proopco-jobs.constant';
import { PROOPCO_SYNC_TOKEN_HEADER } from 'src/constants/proopco-sync.constant';
import { PROOPCO_COMMISSION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { createCommissionForPayment } from 'src/logic-functions/utils/create-commission-for-payment.util';
import {
  MissingSettingError,
  readMoneySettings,
} from 'src/logic-functions/utils/read-app-settings.util';
import { readJobInput } from 'src/logic-functions/utils/read-job-request.util';

export const createCommissionForPaymentHandler = async (payload: unknown) => {
  const request = readJobInput<{ paymentId: string }>(payload);

  if ('error' in request) {
    return { status: 'error', reason: request.error };
  }

  if (!request.input.paymentId) {
    return { status: 'error', reason: 'paymentId is required' };
  }

  try {
    return await createCommissionForPayment({
      client: new CoreApiClient({ runAs: 'application' }),
      paymentId: request.input.paymentId,
      settings: readMoneySettings(),
      now: new Date(),
    });
  } catch (error) {
    if (error instanceof MissingSettingError) {
      return { status: 'error', reason: error.message };
    }

    throw error;
  }
};

export default defineLogicFunction({
  universalIdentifier: PROOPCO_COMMISSION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-create-commission',
  description: 'Creates the Commission a Payment earns and closes the Followup.',
  timeoutSeconds: 60,
  handler: createCommissionForPaymentHandler,
  workflowActionTriggerSettings: { label: 'Create Commission for Payment' },
  httpRouteTriggerSettings: {
    path: COMMISSION_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: [PROOPCO_SYNC_TOKEN_HEADER],
  },
});
