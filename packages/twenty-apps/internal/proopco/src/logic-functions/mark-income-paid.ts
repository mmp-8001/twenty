import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { MARK_INCOME_PAID_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  memberDisplayName,
  requireFullAdmin,
  resolveCodeCaller,
} from 'src/logic-functions/utils/code-caller.util';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { markIncomesPaid } from 'src/logic-functions/utils/income-paid.util';
import { withRefusals } from 'src/logic-functions/utils/refusal.util';

export const handleMarkIncomePaid = async (routePayload: RoutePayload<unknown>) =>
  withRefusals(async () => {
    const context = applicationClients();
    const caller = await resolveCodeCaller(context.client, routePayload);

    requireFullAdmin(caller);

    const body = routePayload.body as Record<string, unknown> | null;

    return new Response(
      await markIncomesPaid(context, {
        caller: { memberId: caller.member.id, name: memberDisplayName(caller) },
        incomeIds: body?.incomeIds,
        now: new Date(),
      }),
    );
  });

export default defineLogicFunction({
  universalIdentifier: MARK_INCOME_PAID_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'mark-income-paid',
  description: 'Full Admin: marks the selected monthly incomes as paid.',
  timeoutSeconds: 120,
  handler: handleMarkIncomePaid,
  httpRouteTriggerSettings: {
    path: '/incomes/paid',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
