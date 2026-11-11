import { isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { RESEND_SMS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { resendSms } from 'src/logic-functions/utils/code-activation.util';
import { activationCallerOf, resolveCodeCaller } from 'src/logic-functions/utils/code-caller.util';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { createPlatformClient } from 'src/logic-functions/utils/platform-client.util';
import { Refusal, refusalResponse } from 'src/logic-functions/utils/refusal.util';

export const handleResendSms = async (routePayload: RoutePayload<unknown>) => {
  try {
    const { client } = applicationClients();
    const caller = await resolveCodeCaller(client, routePayload);
    const activationId = (routePayload.body as { activationId?: unknown } | null)?.activationId;

    if (!isString(activationId)) {
      throw new Refusal(400, 'INVALID_BODY', 'activationId is required');
    }

    return new Response(
      await resendSms(client, createPlatformClient(), activationId, activationCallerOf(caller), new Date()),
    );
  } catch (error) {
    return refusalResponse(error);
  }
};

export default defineLogicFunction({
  universalIdentifier: RESEND_SMS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'resend-sms',
  description: 'Sends the code SMS again for an active activation.',
  timeoutSeconds: 30,
  handler: handleResendSms,
  httpRouteTriggerSettings: {
    path: '/activations/resend-sms',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
