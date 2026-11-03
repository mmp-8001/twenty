import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  ENQUEUE_ROUTE_PATH,
  ENQUEUE_TOKEN_HEADER,
} from 'src/constants/sms.constant';
import { ENQUEUE_FN_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { enqueueMessages } from 'src/logic-functions/utils/enqueue-messages.util';
import { isValidToken } from 'src/logic-functions/utils/is-valid-token.util';
import { parseEnqueueRequest } from 'src/logic-functions/utils/parse-enqueue-request.util';

export const smsEnqueueHandler = async (
  routePayload: RoutePayload<unknown>,
) => {
  if (
    !isValidToken(routePayload.headers[ENQUEUE_TOKEN_HEADER], 'ENQUEUE_TOKEN')
  ) {
    return { success: false, error: 'Invalid enqueue token' };
  }

  const request = parseEnqueueRequest(routePayload.body);

  if ('error' in request) {
    return { success: false, error: request.error };
  }

  return {
    success: true,
    results: await enqueueMessages(
      new CoreApiClient({ runAs: 'application' }),
      request.messages,
    ),
  };
};

export default defineLogicFunction({
  universalIdentifier: ENQUEUE_FN_UNIVERSAL_IDENTIFIER,
  name: 'sms-enqueue',
  description:
    'Queues SMS messages; invalid and opted-out numbers are recorded, not queued.',
  timeoutSeconds: 30,
  handler: smsEnqueueHandler,
  httpRouteTriggerSettings: {
    path: ENQUEUE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: [ENQUEUE_TOKEN_HEADER],
  },
});
