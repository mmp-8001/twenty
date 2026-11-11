import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { UNFREEZE_AGENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { unfreezeAgent } from 'src/logic-functions/utils/freeze-agent.util';
import { resolveStaffCaller } from 'src/logic-functions/utils/code-caller.util';
import { refusalResponse } from 'src/logic-functions/utils/refusal.util';

export const handleUnfreezeAgent = async (routePayload: RoutePayload<unknown>) => {
  try {
    const { context, caller } = await resolveStaffCaller(routePayload);

    const body = routePayload.body as Record<string, unknown> | null;

    return new Response(await unfreezeAgent(context, { caller, agentId: body?.agentId, now: new Date() }));
  } catch (error) {
    return refusalResponse(error);
  }
};

export default defineLogicFunction({
  universalIdentifier: UNFREEZE_AGENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'unfreeze-agent',
  description: 'Supervisor or Full Admin: unfreezes an agent and shifts their open deals by the frozen time.',
  timeoutSeconds: 120,
  handler: handleUnfreezeAgent,
  httpRouteTriggerSettings: {
    path: '/agents/unfreeze',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
