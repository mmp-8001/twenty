import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { FREEZE_AGENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { freezeAgent } from 'src/logic-functions/utils/freeze-agent.util';
import { resolveStaffCaller } from 'src/logic-functions/utils/code-caller.util';
import { withRefusals } from 'src/logic-functions/utils/refusal.util';

export const handleFreezeAgent = async (routePayload: RoutePayload<unknown>) =>
  withRefusals(async () => {
    const { context, caller } = await resolveStaffCaller(routePayload);

    const body = routePayload.body as Record<string, unknown> | null;

    return new Response(await freezeAgent(context, { caller, agentId: body?.agentId, now: new Date() }));
  });

export default defineLogicFunction({
  universalIdentifier: FREEZE_AGENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'freeze-agent',
  description: 'Supervisor or Full Admin: freezes an agent now.',
  timeoutSeconds: 120,
  handler: handleFreezeAgent,
  httpRouteTriggerSettings: {
    path: '/agents/freeze',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
