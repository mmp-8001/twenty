import { isString } from '@sniptt/guards';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ADD_REBUY_ROUTE_PATH } from 'src/constants/ownership.constant';
import { ADD_REBUY_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { addRebuyToFollowup } from 'src/logic-functions/utils/add-rebuy-to-followup.util';
import {
  resolveCallerMemberId,
  SIGN_IN_REQUIRED_MESSAGE,
} from 'src/logic-functions/utils/resolve-caller.util';

export const addRebuyHandler = async (routePayload: RoutePayload<unknown>) => {
  const memberId = await resolveCallerMemberId(routePayload);
  const followupId = (routePayload.body as { followupId?: unknown } | null)?.followupId;

  if (!memberId) {
    return { success: false, error: SIGN_IN_REQUIRED_MESSAGE };
  }

  if (!isString(followupId)) {
    return { success: false, error: 'followupId is required' };
  }

  return addRebuyToFollowup({
    client: new CoreApiClient({ runAs: 'application' }),
    memberId,
    followupId,
  });
};

export default defineLogicFunction({
  universalIdentifier: ADD_REBUY_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-add-rebuy',
  description: 'Moves a waiting rebuy case into follow-up for its admin.',
  timeoutSeconds: 30,
  handler: addRebuyHandler,
  httpRouteTriggerSettings: {
    path: ADD_REBUY_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
