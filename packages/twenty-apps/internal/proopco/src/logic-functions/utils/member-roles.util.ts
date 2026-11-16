import { type MetadataApiClient } from 'twenty-client-sdk/metadata';

// Role identifiers per member, read as the app because the caller's token may not list roles.
export const loadMemberRoleIdentifiers = async (
  metadata: MetadataApiClient,
): Promise<Map<string, string[]>> => {
  const { getRoles } = await metadata.query({
    getRoles: { universalIdentifier: true, workspaceMembers: { id: true } },
  });
  const byMember = new Map<string, string[]>();

  for (const role of getRoles) {
    for (const { id } of role.workspaceMembers) {
      byMember.set(id, [...(byMember.get(id) ?? []), role.universalIdentifier as string]);
    }
  }

  return byMember;
};
