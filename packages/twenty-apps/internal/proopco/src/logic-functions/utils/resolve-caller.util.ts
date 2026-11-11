import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { type RoutePayload } from 'twenty-sdk/define';
import { isDefined } from 'twenty-sdk/utils';

// Identity comes from the caller's token, never the body; roles are read as the app because the caller's token may not list them.
export const resolveCallerRoleIdentifiers = async (
  routePayload: RoutePayload<unknown>,
): Promise<string[] | null> => {
  if (!isDefined(routePayload.userWorkspaceId)) {
    return null;
  }

  const { currentUser } = await new MetadataApiClient().query({
    currentUser: { workspaceMember: { id: true } },
  });
  const memberId = currentUser?.workspaceMember?.id;

  if (!isDefined(memberId)) {
    return null;
  }

  const { getRoles } = await new MetadataApiClient({ runAs: 'application' }).query({
    getRoles: { universalIdentifier: true, workspaceMembers: { id: true } },
  });

  return getRoles
    .filter((role) => role.workspaceMembers.some(({ id }) => id === memberId))
    .map(({ universalIdentifier }) => universalIdentifier as string);
};
