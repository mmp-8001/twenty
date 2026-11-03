import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import {
  ENQUEUE_TOKEN_HEADER,
  SEND_CRON_PATTERN,
  SEND_ROUTE_PATH,
} from 'src/constants/sms.constant';
import { SEND_FN_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { isValidToken } from 'src/logic-functions/utils/is-valid-token.util';
import { sendQueuedMessages } from 'src/logic-functions/utils/send-queued-messages.util';
import { getSmsProvider } from 'src/providers/get-sms-provider';

// The cron passes no payload; the route carries a request and the enqueue token.
export const smsSendHandler = async (payload: unknown) => {
  const routePayload = payload as
    { requestContext?: unknown; headers?: Record<string, string> } | undefined;

  if (
    routePayload?.requestContext &&
    !isValidToken(routePayload.headers?.[ENQUEUE_TOKEN_HEADER], 'ENQUEUE_TOKEN')
  ) {
    return { success: false, error: 'Invalid enqueue token' };
  }

  const limit = Number(process.env.RATE_PER_MINUTE);

  if (!Number.isInteger(limit) || limit <= 0) {
    return {
      success: false,
      error: 'RATE_PER_MINUTE must be a positive integer',
    };
  }

  const counts = await sendQueuedMessages({
    client: new CoreApiClient({ runAs: 'application' }),
    provider: getSmsProvider(),
    from: process.env.SMS_SENDER ?? '',
    limit,
  });

  return { success: true, ...counts };
};

export default defineLogicFunction({
  universalIdentifier: SEND_FN_UNIVERSAL_IDENTIFIER,
  name: 'sms-send',
  description:
    'Sends up to RATE_PER_MINUTE queued messages through the configured provider.',
  timeoutSeconds: 55,
  handler: smsSendHandler,
  cronTriggerSettings: { pattern: SEND_CRON_PATTERN },
  httpRouteTriggerSettings: {
    path: SEND_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: [ENQUEUE_TOKEN_HEADER],
  },
});
