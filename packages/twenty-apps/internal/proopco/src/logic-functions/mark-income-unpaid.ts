import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { MARK_INCOME_UNPAID_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  memberDisplayName,
  requireFullAdmin,
  resolveCodeCaller,
} from 'src/logic-functions/utils/code-caller.util';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { markIncomesUnpaid } from 'src/logic-functions/utils/income-paid.util';
import { refusalResponse } from 'src/logic-functions/utils/refusal.util';

export const handleMarkIncomeUnpaid = async (routePayload: RoutePayload<unknown>) => {
  try {
    const context = applicationClients();
    const caller = await resolveCodeCaller(context.client, routePayload);

    requireFullAdmin(caller);

    const body = routePayload.body as Record<string, unknown> | null;

    return new Response(
      await markIncomesUnpaid(context, {
        caller: { memberId: caller.member.id, name: memberDisplayName(caller) },
        incomeIds: body?.incomeIds,
        now: new Date(),
      }),
    );
  } catch (error) {
    return refusalResponse(error);
  }
};

export default defineLogicFunction({
  universalIdentifier: MARK_INCOME_UNPAID_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'mark-income-unpaid',
  description: 'Full Admin: sets the selected monthly incomes back to awaiting payment.',
  timeoutSeconds: 120,
  handler: handleMarkIncomeUnpaid,
  httpRouteTriggerSettings: {
    path: '/incomes/unpaid',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
