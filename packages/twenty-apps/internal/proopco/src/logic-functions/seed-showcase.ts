import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { SEED_SHOWCASE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { withRefusals } from 'src/logic-functions/utils/refusal.util';
import { rateLimitedClient } from 'src/logic-functions/utils/showcase/rate-limited-client.util';
import { seedShowcase } from 'src/logic-functions/utils/showcase/seed-showcase.util';
import { resolveShowcaseCaller } from 'src/logic-functions/utils/showcase/showcase-caller.util';

export const handleSeedShowcase = (routePayload: RoutePayload<unknown>) =>
  withRefusals(async () => {
    const { client, metadata } = applicationClients();
    const caller = await resolveShowcaseCaller(client, routePayload);

    return new Response(
      await seedShowcase({
        client: rateLimitedClient(client),
        metadata,
        caller,
        now: new Date(),
      }),
    );
  });

export default defineLogicFunction({
  universalIdentifier: SEED_SHOWCASE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'seed-showcase',
  description: 'Fills every section with tagged showcase data through the app’s own logic; rerun to resume.',
  timeoutSeconds: 900,
  handler: handleSeedShowcase,
  httpRouteTriggerSettings: {
    path: '/showcase/seed',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
