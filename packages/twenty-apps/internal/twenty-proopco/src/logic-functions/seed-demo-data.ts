import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SEED_DEMO_DATA_ROUTE_PATH } from 'src/constants/demo-data.constant';
import { SEED_DEMO_DATA_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { listRecords } from 'src/logic-functions/utils/list-records.util';
import { runAdminRoute } from 'src/logic-functions/utils/run-admin-route.util';
import { seedDemoData } from 'src/logic-functions/utils/seed-demo-data.util';

// The Full Admin does no operational work, so demo cases belong to active Sales Admins or Supervisors.
// A real member is never frozen or otherwise changed.
export const seedDemoDataHandler = (routePayload: RoutePayload<unknown>) =>
  runAdminRoute(
    routePayload,
    async ({ client, callerId, roleKeys }) => {
      const [ownerA, ownerB = ownerA] = (
        await listRecords<{ id: string; crmStatus: string | null }>(client, 'workspaceMembers', {}, { crmStatus: true })
      )
        .filter(({ id, crmStatus }) => roleKeys.get(id) !== 'FULL_ADMIN' && (crmStatus ?? 'ACTIVE') === 'ACTIVE')
        .sort((left, right) => Number(roleKeys.get(right.id) === 'SALES_ADMIN') - Number(roleKeys.get(left.id) === 'SALES_ADMIN'))
        .map(({ id }) => id);

      if (!ownerA) {
        return { success: false, error: 'Demo data needs at least one active Sales Admin or Supervisor' };
      }

      return { success: true, ...(await seedDemoData({ client, callerId, members: { ownerA, ownerB } })) };
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
