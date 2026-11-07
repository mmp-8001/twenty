import { isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { MARK_INCOME_PAID_ROUTE_PATH } from 'src/constants/income-report.constant';
import { MARK_INCOME_PAID_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { markIncomePaid } from 'src/logic-functions/utils/mark-income-paid.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';

export const markIncomePaidHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(routePayload, async ({ client, callerId, callerRole, body }) =>
    isString(body.incomeId)
      ? markIncomePaid({ client, callerId, callerRole, incomeId: body.incomeId })
      : { success: false, error: 'incomeId is required' },
  );

export default defineLogicFunction({
  universalIdentifier: MARK_INCOME_PAID_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-mark-income-paid',
  description: 'Marks a Monthly Income paid and writes an audit entry. Full Admin only.',
  timeoutSeconds: 30,
  handler: markIncomePaidHandler,
  httpRouteTriggerSettings: { path: MARK_INCOME_PAID_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
