import { isObject, isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { LOG_CALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { loadAgentActor } from 'src/logic-functions/utils/agent-actor.util';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { logCall, type LogCallInput } from 'src/logic-functions/utils/log-call.util';
import { Refusal, refusalResponse } from 'src/logic-functions/utils/refusal.util';
import { resolveCallerMemberId } from 'src/logic-functions/utils/resolve-caller.util';

export const handleLogCall = async (routePayload: RoutePayload<unknown>) => {
  try {
    const { client } = applicationClients();
    const actor = await loadAgentActor(client, await resolveCallerMemberId(routePayload));
    const input = routePayload.body as Partial<LogCallInput> | null;

    if (!isString(input?.personId) || !isObject(input.next)) {
      throw new Refusal(400, 'INVALID_BODY', 'personId and next are required');
    }

    return new Response(await logCall(client, actor, input as LogCallInput, new Date()));
  } catch (error) {
    return refusalResponse(error);
  }
};

export default defineLogicFunction({
  universalIdentifier: LOG_CALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'log-call',
  description: 'Saves a call once (idempotent), then updates the deal clock and the contact queue fields.',
  timeoutSeconds: 60,
  handler: handleLogCall,
  httpRouteTriggerSettings: {
    path: '/calls/log',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
