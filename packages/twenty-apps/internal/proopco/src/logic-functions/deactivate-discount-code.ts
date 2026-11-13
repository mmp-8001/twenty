import { isString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { DEACTIVATE_DISCOUNT_CODE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  memberDisplayName,
  requireFullAdmin,
  resolveCodeCaller,
} from 'src/logic-functions/utils/code-caller.util';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { deactivateDiscountCode } from 'src/logic-functions/utils/discount-code.util';
import { createPlatformClient } from 'src/logic-functions/utils/platform-client.util';
import { Refusal, withRefusals } from 'src/logic-functions/utils/refusal.util';

export const handleDeactivateDiscountCode = async (routePayload: RoutePayload<unknown>) =>
  withRefusals(async () => {
    const { client } = applicationClients();
    const caller = await resolveCodeCaller(client, routePayload);
    const codeId = (routePayload.body as { codeId?: unknown } | null)?.codeId;

    requireFullAdmin(caller);

    if (!isString(codeId)) {
      throw new Refusal(400, 'INVALID_BODY', 'codeId is required');
    }

    return new Response(
      await deactivateDiscountCode(
        client,
        createPlatformClient(),
        { codeId, actorName: memberDisplayName(caller) },
        new Date(),
      ),
    );
  });

export default defineLogicFunction({
  universalIdentifier: DEACTIVATE_DISCOUNT_CODE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'deactivate-discount-code',
  description: 'Full Admin: deactivates a code on the platform first, then invalidates its activations.',
  timeoutSeconds: 60,
  handler: handleDeactivateDiscountCode,
  httpRouteTriggerSettings: {
    path: '/codes/deactivate',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
