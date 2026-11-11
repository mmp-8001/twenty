import { isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { RETRY_ACTIVATION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { retryActivation } from 'src/logic-functions/utils/code-activation.util';
import { activationCallerOf, resolveCodeCaller } from 'src/logic-functions/utils/code-caller.util';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { createPlatformClient } from 'src/logic-functions/utils/platform-client.util';
import { Refusal, refusalResponse } from 'src/logic-functions/utils/refusal.util';

export const handleRetryActivation = async (routePayload: RoutePayload<unknown>) => {
  try {
    const { client } = applicationClients();
    const caller = await resolveCodeCaller(client, routePayload);
    const activationId = (routePayload.body as { activationId?: unknown } | null)?.activationId;

    if (!isString(activationId)) {
      throw new Refusal(400, 'INVALID_BODY', 'activationId is required');
    }

    return new Response(
      await retryActivation(client, createPlatformClient(), activationId, activationCallerOf(caller), new Date()),
    );
  } catch (error) {
    return refusalResponse(error);
  }
};

export default defineLogicFunction({
  universalIdentifier: RETRY_ACTIVATION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'retry-activation',
  description: 'Retries a failed activation with the same idempotency key and sends the SMS.',
  timeoutSeconds: 30,
  handler: handleRetryActivation,
  httpRouteTriggerSettings: {
    path: '/activations/retry',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
