import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { CREATE_DISCOUNT_CODE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { requireFullAdmin, resolveCodeCaller } from 'src/logic-functions/utils/code-caller.util';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import {
  createDiscountCode,
  type CreateDiscountCodeInput,
} from 'src/logic-functions/utils/discount-code.util';
import { createPlatformClient } from 'src/logic-functions/utils/platform-client.util';
import { refusalResponse } from 'src/logic-functions/utils/refusal.util';

export const handleCreateDiscountCode = async (routePayload: RoutePayload<unknown>) => {
  try {
    const { client } = applicationClients();

    requireFullAdmin(await resolveCodeCaller(client, routePayload));

    return new Response(
      await createDiscountCode(
        client,
        createPlatformClient(),
        (routePayload.body ?? {}) as CreateDiscountCodeInput,
        new Date(),
      ),
    );
  } catch (error) {
    return refusalResponse(error);
  }
};

export default defineLogicFunction({
  universalIdentifier: CREATE_DISCOUNT_CODE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'create-discount-code',
  description: 'Full Admin: creates a code on the platform first, then stores it.',
  timeoutSeconds: 30,
  handler: handleCreateDiscountCode,
  httpRouteTriggerSettings: {
    path: '/codes/create',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
