import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { REPORT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { resolveCodeCaller } from 'src/logic-functions/utils/code-caller.util';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { refusalResponse } from 'src/logic-functions/utils/refusal.util';
import { loadReport } from 'src/logic-functions/utils/report.util';

export const handleReport = async (routePayload: RoutePayload<unknown>) => {
  try {
    const { client } = applicationClients();
    const { roles, member } = await resolveCodeCaller(client, routePayload);

    return new Response(
      await loadReport(client, {
        caller: { roles, memberAgentId: member.agentId },
        body: routePayload.body as Record<string, unknown> | null,
        now: new Date(),
      }),
    );
  } catch (error) {
    return refusalResponse(error);
  }
};

export default defineLogicFunction({
  universalIdentifier: REPORT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'report',
  description: 'Reads the Report widget numbers; scope comes from the caller role.',
  timeoutSeconds: 60,
  handler: handleReport,
  httpRouteTriggerSettings: {
    path: '/reports',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
