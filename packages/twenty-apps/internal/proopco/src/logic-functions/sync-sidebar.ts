import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';
import { isDefined } from 'twenty-sdk/utils';

import { SYNC_SIDEBAR_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { listRecords } from 'src/logic-functions/utils/records.util';
import { Refusal, withRefusals } from 'src/logic-functions/utils/refusal.util';
import {
  resolveCallerMemberId,
  resolveCallerRoleIdentifiers,
} from 'src/logic-functions/utils/resolve-caller.util';
import { sidebarSpecOf } from 'src/logic-functions/utils/sidebar/sidebar-spec.util';
import { syncSidebar } from 'src/logic-functions/utils/sidebar/sync-sidebar.util';

export const handleSyncSidebar = (routePayload: RoutePayload<unknown>) =>
  withRefusals(async () => {
    const { userWorkspaceId } = routePayload;
    const memberId = await resolveCallerMemberId(routePayload);
    const roleIdentifiers = await resolveCallerRoleIdentifiers(routePayload);

    if (!isDefined(userWorkspaceId) || !isDefined(memberId) || roleIdentifiers === null) {
      throw new Refusal(401, 'SIGN_IN_REQUIRED', 'Sign in required');
    }

    const { client, metadata: applicationMetadata } = applicationClients();
    const [member] = await listRecords<{ agentId: string | null; locale: string | null }>(
      client,
      'workspaceMembers',
      { id: { eq: memberId } },
      { agentId: true, locale: true },
      1,
    );
    const body = routePayload.body as { force?: boolean } | null;

    return new Response(
      await syncSidebar({
        metadata: new MetadataApiClient(),
        applicationMetadata,
        spec: sidebarSpecOf({
          roleIdentifiers,
          hasAgent: isDefined(member?.agentId),
          locale: member?.locale,
        }),
        userWorkspaceId,
        force: body?.force === true,
      }),
    );
  });

export default defineLogicFunction({
  universalIdentifier: SYNC_SIDEBAR_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'sync-sidebar',
  description: 'Builds the caller’s personal sidebar from their role.',
  timeoutSeconds: 60,
  handler: handleSyncSidebar,
  httpRouteTriggerSettings: {
    path: '/sidebar/sync',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
