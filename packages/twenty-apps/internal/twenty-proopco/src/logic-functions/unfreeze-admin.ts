import { isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { UNFREEZE_ADMIN_ROUTE_PATH } from 'src/constants/admin-management.constant';
import { UNFREEZE_ADMIN_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { unfreezeAdmin } from 'src/logic-functions/utils/freeze-admin.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';

export const unfreezeAdminHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(routePayload, async ({ client, callerId, callerRole, roleKeys, body }) => {
    if (!isString(body.adminId)) {
      return { success: false, error: 'adminId is required' };
    }

    return unfreezeAdmin({
      client,
      callerId,
      callerRole,
      targetId: body.adminId,
      targetRole: roleKeys.get(body.adminId) ?? null,
      reason: isString(body.reason) ? body.reason : null,
    });
  });

export default defineLogicFunction({
  universalIdentifier: UNFREEZE_ADMIN_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-unfreeze-admin',
  description: 'Unfreezes an Agent: deadlines resume and open call windows shift.',
  timeoutSeconds: 120,
  handler: unfreezeAdminHandler,
  httpRouteTriggerSettings: { path: UNFREEZE_ADMIN_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
