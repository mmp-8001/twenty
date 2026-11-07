import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ADD_TO_FOLLOWUP_ROUTE_PATH } from 'src/constants/ownership.constant';
import { ADD_TO_FOLLOWUP_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { addToFollowup } from 'src/logic-functions/utils/add-to-followup.util';
import {
  resolveCallerMemberId,
  SIGN_IN_REQUIRED_MESSAGE,
} from 'src/logic-functions/utils/resolve-caller.util';
import { isString } from '@sniptt/guards';

export const addToFollowupHandler = async (routePayload: RoutePayload<unknown>) => {
  const memberId = await resolveCallerMemberId(routePayload);
  const personId = (routePayload.body as { personId?: unknown } | null)?.personId;

  if (!memberId) {
    return { success: false, error: SIGN_IN_REQUIRED_MESSAGE };
  }

  if (!isString(personId)) {
    return { success: false, error: 'personId is required' };
  }

  // The app writes the records: the caller's role only reads them.
  return addToFollowup({
    client: new CoreApiClient({ runAs: 'application' }),
    memberId,
    personId,
  });
};

export default defineLogicFunction({
  universalIdentifier: ADD_TO_FOLLOWUP_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-add-to-followup',
  description: 'Claims a User for the caller: first click wins.',
  timeoutSeconds: 30,
  handler: addToFollowupHandler,
  httpRouteTriggerSettings: {
    path: ADD_TO_FOLLOWUP_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
