import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { REACTIVATE_AGENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { reactivateAgent } from 'src/logic-functions/utils/agent-lifecycle.util';
import { requireFullAdmin, resolveStaffCaller } from 'src/logic-functions/utils/code-caller.util';
import { refusalResponse } from 'src/logic-functions/utils/refusal.util';

export const handleReactivateAgent = async (routePayload: RoutePayload<unknown>) => {
  try {
    const { context, caller } = await resolveStaffCaller(routePayload);

    requireFullAdmin({ roles: caller.roles });

    const body = routePayload.body as Record<string, unknown> | null;

    return new Response(await reactivateAgent(context, { caller, agentId: body?.agentId, now: new Date() }));
  } catch (error) {
    return refusalResponse(error);
  }
};

export default defineLogicFunction({
  universalIdentifier: REACTIVATE_AGENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'reactivate-agent',
  description: 'Full Admin: reactivates an agent.',
  timeoutSeconds: 120,
  handler: handleReactivateAgent,
  httpRouteTriggerSettings: {
    path: '/agents/reactivate',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
