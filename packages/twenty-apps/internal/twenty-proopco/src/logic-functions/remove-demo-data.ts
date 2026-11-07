import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { REMOVE_DEMO_DATA_ROUTE_PATH } from 'src/constants/demo-data.constant';
import { REMOVE_DEMO_DATA_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { removeDemoData } from 'src/logic-functions/utils/remove-demo-data.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';

export const removeDemoDataHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(
    routePayload,
    async ({ client }) => ({ success: true, ...(await removeDemoData({ client })) }),
    { isAllowed: (callerRole) => callerRole === 'FULL_ADMIN' },
  );

export default defineLogicFunction({
  universalIdentifier: REMOVE_DEMO_DATA_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-remove-demo-data',
  description: 'Deletes only records under a demo- key and restores the member the demo froze. Full Admin only.',
  timeoutSeconds: 300,
  handler: removeDemoDataHandler,
  httpRouteTriggerSettings: { path: REMOVE_DEMO_DATA_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
