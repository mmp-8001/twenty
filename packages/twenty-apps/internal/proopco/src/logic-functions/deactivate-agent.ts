import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { DEACTIVATE_AGENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { deactivateAgent } from 'src/logic-functions/utils/agent-lifecycle.util';
import { requireFullAdmin, resolveStaffCaller } from 'src/logic-functions/utils/code-caller.util';
import { withRefusals } from 'src/logic-functions/utils/refusal.util';

export const handleDeactivateAgent = async (routePayload: RoutePayload<unknown>) =>
  withRefusals(async () => {
    const { context, caller } = await resolveStaffCaller(routePayload);

    requireFullAdmin({ roles: caller.roles });

    const body = routePayload.body as Record<string, unknown> | null;

    return new Response(await deactivateAgent(context, { caller, agentId: body?.agentId, now: new Date() }));
  });

export default defineLogicFunction({
  universalIdentifier: DEACTIVATE_AGENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'deactivate-agent',
  description: 'Full Admin: deactivates an agent that owns no contacts.',
  timeoutSeconds: 120,
  handler: handleDeactivateAgent,
  httpRouteTriggerSettings: {
    path: '/agents/deactivate',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
