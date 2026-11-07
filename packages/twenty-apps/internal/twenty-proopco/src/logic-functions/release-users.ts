import { isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { RELEASE_USERS_ROUTE_PATH } from 'src/constants/admin-management.constant';
import { RELEASE_USERS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { reassignUsers } from 'src/logic-functions/utils/reassign-users.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';
import { canManageOwnership } from 'src/utils/admin-permissions.util';

export const releaseUsersHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(
    routePayload,
    ({ client, callerId, body }) =>
      reassignUsers({
        client,
        callerId,
        mode: { type: 'RELEASE' },
        personIds: Array.isArray(body.personIds) ? body.personIds.filter(isString) : undefined,
        fromAdminId: isString(body.fromAdminId) ? body.fromAdminId : undefined,
        reason: isString(body.reason) ? body.reason : '',
      }),
    { isAllowed: canManageOwnership },
  );

export default defineLogicFunction({
  universalIdentifier: RELEASE_USERS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-release-users',
  description: 'Releases Users back to the pool: the Ownership ends released by a manager.',
  timeoutSeconds: 120,
  handler: releaseUsersHandler,
  httpRouteTriggerSettings: { path: RELEASE_USERS_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
