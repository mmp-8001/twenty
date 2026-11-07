import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { TEAM_REPORT_ROUTE_PATH } from 'src/constants/income-report.constant';
import { TEAM_REPORT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readTeamReport } from 'src/logic-functions/utils/read-team-report.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';
import { canManageOwnership } from 'src/utils/admin-permissions.util';
import { readReportPeriod } from 'src/utils/read-report-period.util';

export const teamReportHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(
    routePayload,
    ({ client, roleKeys, body }) => readTeamReport({ client, roleKeys, period: readReportPeriod(body.period) }),
    { isAllowed: canManageOwnership },
  );

export default defineLogicFunction({
  universalIdentifier: TEAM_REPORT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-team-report',
  description: 'Returns team totals and every Agent ranked by name. Supervisor and Full Admin only.',
  timeoutSeconds: 60,
  handler: teamReportHandler,
  httpRouteTriggerSettings: { path: TEAM_REPORT_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
