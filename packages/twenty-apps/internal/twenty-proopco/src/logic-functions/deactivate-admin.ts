import { isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DEACTIVATE_ADMIN_ROUTE_PATH } from 'src/constants/admin-management.constant';
import { DEACTIVATE_ADMIN_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { deactivateAdmin } from 'src/logic-functions/utils/deactivate-admin.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';

export const deactivateAdminHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(routePayload, async ({ client, callerId, callerRole, body }) => {
    if (!isString(body.adminId)) {
      return { success: false, error: 'adminId is required' };
    }

    return deactivateAdmin({
      client,
      callerId,
      callerRole,
      targetId: body.adminId,
      reason: isString(body.reason) ? body.reason : '',
    });
  });

export default defineLogicFunction({
  universalIdentifier: DEACTIVATE_ADMIN_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-deactivate-admin',
  description: 'Deactivates an Agent who owns no users. Full Admin only.',
  timeoutSeconds: 30,
  handler: deactivateAdminHandler,
  httpRouteTriggerSettings: { path: DEACTIVATE_ADMIN_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
