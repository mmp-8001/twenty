import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { CLEAR_SHOWCASE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { withRefusals } from 'src/logic-functions/utils/refusal.util';
import { clearShowcase } from 'src/logic-functions/utils/showcase/clear-showcase.util';
import { rateLimitedClient } from 'src/logic-functions/utils/showcase/rate-limited-client.util';
import { resolveShowcaseCaller } from 'src/logic-functions/utils/showcase/showcase-caller.util';

export const handleClearShowcase = (routePayload: RoutePayload<unknown>) =>
  withRefusals(async () => {
    const { client, metadata } = applicationClients();

    await resolveShowcaseCaller(client, routePayload);

    return new Response(
      await clearShowcase({
        client: rateLimitedClient(client),
        metadata,
        now: new Date(),
      }),
    );
  });

export default defineLogicFunction({
  universalIdentifier: CLEAR_SHOWCASE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'clear-showcase',
  description: 'Soft-deletes every showcase row and unlinks the showcase agents from their members.',
  timeoutSeconds: 600,
  handler: handleClearShowcase,
  httpRouteTriggerSettings: {
    path: '/showcase/clear',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
