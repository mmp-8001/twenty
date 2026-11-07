import { isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { RESEND_OFFER_SMS_ROUTE_PATH } from 'src/constants/offer.constant';
import { RESEND_OFFER_SMS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { resendOfferSms } from 'src/logic-functions/utils/activate-offer.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';

export const resendOfferSmsHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(routePayload, async ({ client, callerId, body }) =>
    isString(body.activationId)
      ? resendOfferSms({ client, memberId: callerId, activationId: body.activationId })
      : { success: false, error: 'activationId is required' },
  );

export default defineLogicFunction({
  universalIdentifier: RESEND_OFFER_SMS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-resend-offer-sms',
  description: 'Queues the code SMS of an active activation again; the SMS app dedups on the activation.',
  timeoutSeconds: 30,
  handler: resendOfferSmsHandler,
  httpRouteTriggerSettings: { path: RESEND_OFFER_SMS_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
