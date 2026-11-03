import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  CALLBACK_TOKEN_HEADER,
  DELIVERY_ROUTE_PATH,
} from 'src/constants/sms.constant';
import { DELIVERY_FN_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { isValidToken } from 'src/logic-functions/utils/is-valid-token.util';
import {
  listRecords,
  updateRecord,
} from 'src/logic-functions/utils/list-records.util';

type DeliveryReport = {
  providerMessageId?: string;
  status?: string;
  error?: string;
};

export const smsDeliveryHandler = async (
  routePayload: RoutePayload<DeliveryReport>,
) => {
  if (
    !isValidToken(
      routePayload.headers[CALLBACK_TOKEN_HEADER],
      'SMS_CALLBACK_TOKEN',
    )
  ) {
    return { success: false, error: 'Invalid callback token' };
  }

  const { providerMessageId, status, error } = routePayload.body ?? {};

  if (!providerMessageId || (status !== 'delivered' && status !== 'failed')) {
    return {
      success: false,
      error:
        'providerMessageId and a status of delivered or failed are required',
    };
  }

  const client = new CoreApiClient({ runAs: 'application' });
  const [message] = await listRecords<{ id: string }>(
    client,
    'smsMessages',
    { providerMessageId: { eq: providerMessageId } },
    {},
  );

  if (!message) {
    return { success: false, error: `No message with id ${providerMessageId}` };
  }

  await updateRecord(
    client,
    'SmsMessage',
    message.id,
    status === 'delivered'
      ? { status: 'DELIVERED', deliveredAt: new Date().toISOString() }
      : { status: 'FAILED', error: error ?? 'Delivery failed' },
  );

  return { success: true };
};

export default defineLogicFunction({
  universalIdentifier: DELIVERY_FN_UNIVERSAL_IDENTIFIER,
  name: 'sms-delivery',
  description: 'Records a provider delivery report on the message.',
  timeoutSeconds: 30,
  handler: smsDeliveryHandler,
  httpRouteTriggerSettings: {
    path: DELIVERY_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: [CALLBACK_TOKEN_HEADER],
  },
});
