import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ADMINS_ROUTE_PATH } from 'src/constants/admin-management.constant';
import { ADMINS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readAdmins } from 'src/logic-functions/utils/read-admins.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';
import { canManageOwnership } from 'src/utils/admin-permissions.util';

export const adminsHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(
    routePayload,
    async ({ client, roleKeys, callerRole }) => ({
      success: true,
      callerRole,
      admins: await readAdmins({ client, roleKeys }),
    }),
    { isAllowed: canManageOwnership },
  );

export default defineLogicFunction({
  universalIdentifier: ADMINS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-admins',
  description: 'Lists Agents with role, status, owned Users and freeze days. Supervisor and Full Admin.',
  timeoutSeconds: 30,
  handler: adminsHandler,
  httpRouteTriggerSettings: { path: ADMINS_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
