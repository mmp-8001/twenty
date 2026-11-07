import { isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { OFFER_OPTIONS_ROUTE_PATH } from 'src/constants/offer.constant';
import { OFFER_OPTIONS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readOfferOptions } from 'src/logic-functions/utils/read-offer-options.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';

export const offerOptionsHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(routePayload, async ({ client, callerId, body }) =>
    isString(body.callId)
      ? readOfferOptions({ client, memberId: callerId, callId: body.callId })
      : { success: false, error: 'callId is required' },
  );

export default defineLogicFunction({
  universalIdentifier: OFFER_OPTIONS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-offer-options',
  description: 'Lists the offers the end-of-call form may activate for an answered call.',
  timeoutSeconds: 30,
  handler: offerOptionsHandler,
  httpRouteTriggerSettings: { path: OFFER_OPTIONS_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
