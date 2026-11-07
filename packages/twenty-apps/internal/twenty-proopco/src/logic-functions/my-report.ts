import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { MY_REPORT_ROUTE_PATH } from 'src/constants/income-report.constant';
import { MY_REPORT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readMyReport } from 'src/logic-functions/utils/read-my-report.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';
import { readReportPeriod } from 'src/utils/read-report-period.util';

// Always the caller's own numbers: the body names a period, never an Admin.
export const myReportHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(
    routePayload,
    ({ client, callerId, body }) => readMyReport({ client, memberId: callerId, period: readReportPeriod(body.period) }),
    { isAllowed: (callerRole) => callerRole !== null },
  );

export default defineLogicFunction({
  universalIdentifier: MY_REPORT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-my-report',
  description: 'Returns the caller own report for a period, with Commissions and monthly incomes.',
  timeoutSeconds: 60,
  handler: myReportHandler,
  httpRouteTriggerSettings: { path: MY_REPORT_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
