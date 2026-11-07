import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { type RoutePayload } from 'twenty-sdk/define';

import { isDefined } from 'src/utils/is-defined';
import { type AdminRoleKey, roleKeyOf } from 'src/utils/admin-permissions.util';

export const SIGN_IN_REQUIRED_MESSAGE = 'Sign in required';

// A route called with a user's token learns who is calling from the metadata API,
// which answers for that token; the body is never trusted for identity.
export const resolveCallerMemberId = async (
  routePayload: RoutePayload<unknown>,
): Promise<string | null> => {
  if (!isDefined(routePayload.userWorkspaceId)) {
    return null;
  }

  const { currentUser } = await new MetadataApiClient().query({
    currentUser: { workspaceMember: { id: true } },
  });

  return currentUser?.workspaceMember?.id ?? null;
};

// Every member's CRM role, read as the app: the caller's own token may not list roles.
export const readMemberRoleKeys = async (): Promise<Map<string, AdminRoleKey>> => {
  const { getRoles } = await new MetadataApiClient({ runAs: 'application' }).query({
    getRoles: { universalIdentifier: true, workspaceMembers: { id: true } },
  });
  const roleKeys = new Map<string, AdminRoleKey>();

  for (const role of getRoles) {
    const roleKey = roleKeyOf(role.universalIdentifier);

    for (const member of roleKey ? role.workspaceMembers : []) {
      roleKeys.set(member.id, roleKey as AdminRoleKey);
    }
  }

  return roleKeys;
};
