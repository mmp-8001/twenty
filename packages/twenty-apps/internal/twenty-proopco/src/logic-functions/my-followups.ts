import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { MY_FOLLOWUPS_ROUTE_PATH } from 'src/constants/ownership.constant';
import { MY_FOLLOWUPS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readMyFollowups } from 'src/logic-functions/utils/read-my-followups.util';
import {
  resolveCallerMemberId,
  SIGN_IN_REQUIRED_MESSAGE,
} from 'src/logic-functions/utils/resolve-caller.util';

export const myFollowupsHandler = async (routePayload: RoutePayload<unknown>) => {
  const memberId = await resolveCallerMemberId(routePayload);

  if (!memberId) {
    return { success: false, error: SIGN_IN_REQUIRED_MESSAGE };
  }

  const now = new Date();

  // Read as the app and filtered to the caller, so the queue never depends on a role's row-level view.
  return {
    success: true,
    now: now.toISOString(),
    rows: await readMyFollowups({ client: new CoreApiClient({ runAs: 'application' }), memberId, now }),
  };
};

export default defineLogicFunction({
  universalIdentifier: MY_FOLLOWUPS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-my-followups',
  description: 'Returns the caller queue: open cases and successful Users with a call time.',
  timeoutSeconds: 30,
  handler: myFollowupsHandler,
  httpRouteTriggerSettings: {
    path: MY_FOLLOWUPS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
