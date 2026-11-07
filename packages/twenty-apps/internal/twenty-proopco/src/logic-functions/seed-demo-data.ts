import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SEED_DEMO_DATA_ROUTE_PATH } from 'src/constants/demo-data.constant';
import { SEED_DEMO_DATA_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { listRecords } from 'src/logic-functions/utils/list-records.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';
import { seedDemoData } from 'src/logic-functions/utils/seed-demo-data.util';

// Owners are existing members: the caller and one other; a second other member becomes the frozen admin.
export const seedDemoDataHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(
    routePayload,
    async ({ client, callerId, roleKeys }) => {
      const members = (
        await listRecords<{ id: string; crmStatus: string | null }>(client, 'workspaceMembers', {}, { crmStatus: true })
      ).filter(({ id, crmStatus }) => id !== callerId && (crmStatus ?? 'ACTIVE') === 'ACTIVE');
      const [others, fullAdmins] = [
        members.filter(({ id }) => roleKeys.get(id) !== 'FULL_ADMIN'),
        members.filter(({ id }) => roleKeys.get(id) === 'FULL_ADMIN'),
      ];
      const [ownerB = callerId, frozen = null] = [...others, ...fullAdmins].map(({ id }) => id);

      return {
        success: true,
        ...(await seedDemoData({ client, callerId, members: { ownerA: callerId, ownerB, frozen } })),
      };
    },
    { isAllowed: (callerRole) => callerRole === 'FULL_ADMIN' },
  );

export default defineLogicFunction({
  universalIdentifier: SEED_DEMO_DATA_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-seed-demo-data',
  description: 'Creates demo Users, cases, calls, a commission and monthly incomes, all under a demo- key. Full Admin only.',
  timeoutSeconds: 300,
  handler: seedDemoDataHandler,
  httpRouteTriggerSettings: { path: SEED_DEMO_DATA_ROUTE_PATH, httpMethod: 'POST', isAuthRequired: true },
});
