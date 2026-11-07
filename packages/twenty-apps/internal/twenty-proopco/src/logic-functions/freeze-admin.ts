import { isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { FREEZE_ADMIN_ROUTE_PATH } from 'src/constants/admin-management.constant';
import { FREEZE_ADMIN_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { freezeAdmin } from 'src/logic-functions/utils/freeze-admin.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';

export const freezeAdminHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(routePayload, async ({ client, callerId, callerRole, roleKeys, body }) => {
    if (!isString(body.adminId)) {
      return { success: false, error: 'adminId is required' };
    }

    return freezeAdmin({
      client,
      callerId,
      callerRole,
      targetId: body.adminId,
      targetRole: roleKeys.get(body.adminId) ?? null,
      reason: isString(body.reason) ? body.reason : '',
    });
  });

export default defineLogicFunction({
  universalIdentifier: FREEZE_ADMIN_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-freeze-admin',
  description: 'Freezes an Admin: their cases keep the remaining time and lose their deadline.',
  timeoutSeconds: 60,
  handler: freezeAdminHandler,
  httpRouteTriggerSettings: { path: FREEZE_ADMIN_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
