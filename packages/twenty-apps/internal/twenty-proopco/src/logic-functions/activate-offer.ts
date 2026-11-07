import { isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ACTIVATE_OFFER_ROUTE_PATH } from 'src/constants/offer.constant';
import { ACTIVATE_OFFER_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { activateOffer } from 'src/logic-functions/utils/activate-offer.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';

// Also the Retry route: an existing failed activation is retried, any other existing one is refused.
export const activateOfferHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(routePayload, async ({ client, callerId, body }) =>
    isString(body.personId) && isString(body.offerId)
      ? activateOffer({
          client,
          memberId: callerId,
          personId: body.personId,
          offerId: body.offerId,
          callId: isString(body.callId) ? body.callId : null,
        })
      : { success: false, error: 'personId and offerId are required' },
  );

export default defineLogicFunction({
  universalIdentifier: ACTIVATE_OFFER_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-activate-offer',
  description: 'Activates an Offer for a User after an answered call, or retries a failed activation.',
  timeoutSeconds: 30,
  handler: activateOfferHandler,
  httpRouteTriggerSettings: { path: ACTIVATE_OFFER_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
