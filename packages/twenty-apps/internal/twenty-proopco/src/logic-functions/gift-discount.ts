import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { GIFT_DISCOUNT_ROUTE_PATH } from 'src/constants/campaign.constant';
import { PROOPCO_GIFT_DISCOUNT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { giftDiscount } from 'src/logic-functions/utils/gift-discount.util';

export const giftDiscountHandler = async (
  routePayload: RoutePayload<{ personId?: string; code?: string }>,
) => {
  const { personId, code } = routePayload.body ?? {};

  if (!personId || !code?.trim()) {
    return { success: false, error: 'personId and code are required' };
  }

  try {
    return await giftDiscount({
      client: new CoreApiClient({ runAs: 'application' }),
      personId,
      code: code.trim(),
    });
  } catch (error) {
    return {
      success: false,
      error: `Could not reach proopco: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

export default defineLogicFunction({
  universalIdentifier:
    PROOPCO_GIFT_DISCOUNT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-gift-discount',
  description: 'Applies an existing proopco discount code to a Trader.',
  timeoutSeconds: 30,
  handler: giftDiscountHandler,
  httpRouteTriggerSettings: {
    path: GIFT_DISCOUNT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
