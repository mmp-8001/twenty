import { isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { TRANSFER_USERS_ROUTE_PATH } from 'src/constants/admin-management.constant';
import { TRANSFER_USERS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { reassignUsers } from 'src/logic-functions/utils/reassign-users.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';
import { canManageOwnership } from 'src/utils/admin-permissions.util';

export const transferUsersHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(
    routePayload,
    async ({ client, callerId, roleKeys, body }) => {
      const toAdminId = body.toAdminId;

      if (!isString(toAdminId)) {
        return { success: false, error: 'toAdminId is required' };
      }

      // The Full Admin does no operational work, so users go to a Sales Admin or a Supervisor.
      if (!['SALES_ADMIN', 'SUPERVISOR'].includes(roleKeys.get(toAdminId) ?? '')) {
        return { success: false, error: 'Users can only be transferred to a Sales Admin or a Supervisor' };
      }

      return reassignUsers({
        client,
        callerId,
        mode: { type: 'TRANSFER', toAdminId },
        personIds: Array.isArray(body.personIds) ? body.personIds.filter(isString) : undefined,
        fromAdminId: isString(body.fromAdminId) ? body.fromAdminId : undefined,
        reason: isString(body.reason) ? body.reason : '',
      });
    },
    { isAllowed: canManageOwnership },
  );

export default defineLogicFunction({
  universalIdentifier: TRANSFER_USERS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-transfer-users',
  description: 'Transfers one, several or all Users of an Admin to another Admin.',
  timeoutSeconds: 120,
  handler: transferUsersHandler,
  httpRouteTriggerSettings: { path: TRANSFER_USERS_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
