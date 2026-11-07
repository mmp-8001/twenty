import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { RECORD_CALL_ROUTE_PATH } from 'src/constants/ownership.constant';
import { RECORD_CALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  readCallFormInput,
  recordCall,
} from 'src/logic-functions/utils/record-call.util';
import {
  resolveCallerMemberId,
  SIGN_IN_REQUIRED_MESSAGE,
} from 'src/logic-functions/utils/resolve-caller.util';

export const recordCallHandler = async (routePayload: RoutePayload<unknown>) => {
  const memberId = await resolveCallerMemberId(routePayload);

  if (!memberId) {
    return { success: false, error: SIGN_IN_REQUIRED_MESSAGE };
  }

  const form = readCallFormInput(routePayload.body);

  if (!form) {
    return { success: false, error: 'personId and technicalStatus are required' };
  }

  // The app writes the call: no role can update a Call, so the form cannot be bypassed.
  return recordCall({
    client: new CoreApiClient({ runAs: 'application' }),
    memberId,
    ...form,
  });
};

export default defineLogicFunction({
  universalIdentifier: RECORD_CALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-record-call',
  description: 'Saves the end-of-call form: the Call, its reasons and the case transition.',
  timeoutSeconds: 30,
  handler: recordCallHandler,
  httpRouteTriggerSettings: {
    path: RECORD_CALL_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
