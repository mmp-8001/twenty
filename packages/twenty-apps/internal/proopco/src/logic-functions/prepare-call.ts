import { isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { PREPARE_CALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { loadAgentActor } from 'src/logic-functions/utils/agent-actor.util';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { prepareCall } from 'src/logic-functions/utils/prepare-call.util';
import { Refusal, refusalResponse } from 'src/logic-functions/utils/refusal.util';
import { resolveCallerMemberId } from 'src/logic-functions/utils/resolve-caller.util';

export const handlePrepareCall = async (routePayload: RoutePayload<unknown>) => {
  try {
    const { client } = applicationClients();
    const actor = await loadAgentActor(client, await resolveCallerMemberId(routePayload));
    const personId = (routePayload.body as { personId?: unknown } | null)?.personId;

    if (!isString(personId)) {
      throw new Refusal(400, 'CONTACT_REQUIRED', 'personId is required');
    }

    return new Response(await prepareCall(client, actor, personId, new Date()));
  } catch (error) {
    return refusalResponse(error);
  }
};

export default defineLogicFunction({
  universalIdentifier: PREPARE_CALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'prepare-call',
  description: 'Log call form options: the refusals, active reasons and next-call defaults for a contact.',
  timeoutSeconds: 30,
  handler: handlePrepareCall,
  httpRouteTriggerSettings: {
    path: '/calls/prepare',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
