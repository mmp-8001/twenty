import { isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DEACTIVATE_OFFER_ROUTE_PATH } from 'src/constants/offer.constant';
import { DEACTIVATE_OFFER_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { deactivateOffer } from 'src/logic-functions/utils/deactivate-offer.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';

export const deactivateOfferHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(routePayload, async ({ client, callerId, callerRole, body }) =>
    isString(body.offerId)
      ? deactivateOffer({
          client,
          callerId,
          callerRole,
          offerId: body.offerId,
          reason: isString(body.reason) ? body.reason : null,
        })
      : { success: false, error: 'offerId is required' },
  );

export default defineLogicFunction({
  universalIdentifier: DEACTIVATE_OFFER_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-deactivate-offer',
  description: 'Deactivates an Offer and voids its activations for every User. Full Admin only.',
  timeoutSeconds: 30,
  handler: deactivateOfferHandler,
  httpRouteTriggerSettings: { path: DEACTIVATE_OFFER_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
