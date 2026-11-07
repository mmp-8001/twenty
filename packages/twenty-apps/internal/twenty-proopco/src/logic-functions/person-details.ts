import { isString } from '@sniptt/guards';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { PERSON_DETAILS_ROUTE_PATH } from 'src/constants/ownership.constant';
import { PERSON_DETAILS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readPersonDetails } from 'src/logic-functions/utils/read-person-details.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';

export const personDetailsHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(routePayload, async ({ client, body }) =>
    isString(body.personId)
      ? readPersonDetails({ userClient: new CoreApiClient(), appClient: client, personId: body.personId })
      : { success: false, error: 'personId is required' },
  );

export default defineLogicFunction({
  universalIdentifier: PERSON_DETAILS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-person-details',
  description: 'Challenge Accounts and Offer activations of a User the caller can see.',
  timeoutSeconds: 30,
  handler: personDetailsHandler,
  httpRouteTriggerSettings: { path: PERSON_DETAILS_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
