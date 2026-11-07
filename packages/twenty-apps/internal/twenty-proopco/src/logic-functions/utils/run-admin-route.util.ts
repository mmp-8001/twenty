import { CoreApiClient } from 'twenty-client-sdk/core';
import { type RoutePayload } from 'twenty-sdk/define';

import { NOT_ALLOWED_MESSAGE } from 'src/constants/admin-management.constant';
import { type RecordsClient } from 'src/logic-functions/utils/list-records.util';
import {
  readMemberRoleKeys,
  resolveCallerMemberId,
  SIGN_IN_REQUIRED_MESSAGE,
} from 'src/logic-functions/utils/resolve-caller.util';
import { type AdminRoleKey } from 'src/utils/admin-permissions.util';

export type AdminRouteContext = {
  client: RecordsClient;
  callerId: string;
  callerRole: AdminRoleKey | null;
  roleKeys: Map<string, AdminRoleKey>;
  body: Record<string, unknown>;
};

// Identity and role come from the caller's token, never the body; the records are written as the app.
export const runAdminRoute = async (
  routePayload: RoutePayload<unknown>,
  run: (context: AdminRouteContext) => Promise<unknown>,
  { isAllowed }: { isAllowed?: (callerRole: AdminRoleKey | null) => boolean } = {},
) => {
  const callerId = await resolveCallerMemberId(routePayload);

  if (!callerId) {
    return { success: false, error: SIGN_IN_REQUIRED_MESSAGE };
  }

  const roleKeys = await readMemberRoleKeys();
  const callerRole = roleKeys.get(callerId) ?? null;

  if (isAllowed && !isAllowed(callerRole)) {
    return { success: false, error: NOT_ALLOWED_MESSAGE };
  }

  return run({
    client: new CoreApiClient({ runAs: 'application' }),
    callerId,
    callerRole,
    roleKeys,
    body: (routePayload.body ?? {}) as Record<string, unknown>,
  });
};
