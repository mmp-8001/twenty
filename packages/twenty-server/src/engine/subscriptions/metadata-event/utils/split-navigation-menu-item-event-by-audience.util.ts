import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceBroadcastEvent } from 'src/engine/subscriptions/workspace-event-broadcaster/types/workspace-broadcast-event.type';

type NavigationMenuItemRecord = {
  userWorkspaceId?: string | null;
  visibleToRoleUniversalIdentifiers?: string[] | null;
};

type RoleAssignment = {
  userWorkspaceId: string;
  roleUniversalIdentifier: string;
};

// undefined means every stream.
const audienceOf = (
  record: NavigationMenuItemRecord | undefined,
  roleAssignments: RoleAssignment[],
): string[] | undefined => {
  if (isNonEmptyString(record?.userWorkspaceId)) {
    return [record.userWorkspaceId];
  }

  const visibleToRoleUniversalIdentifiers =
    record?.visibleToRoleUniversalIdentifiers;

  if (!isDefined(visibleToRoleUniversalIdentifiers)) {
    return undefined;
  }

  return roleAssignments
    .filter(({ roleUniversalIdentifier }) =>
      visibleToRoleUniversalIdentifiers.includes(roleUniversalIdentifier),
    )
    .map(({ userWorkspaceId }) => userWorkspaceId);
};

// An update that changes who sees an item becomes a create for users who gain it and a delete for users who lose it,
// since the front applies events to its persisted store without filtering them.
export const splitNavigationMenuItemEventByAudience = (
  event: WorkspaceBroadcastEvent,
  roleAssignments: RoleAssignment[],
): WorkspaceBroadcastEvent[] => {
  const before = event.properties.before as
    | NavigationMenuItemRecord
    | undefined;
  const after = event.properties.after as NavigationMenuItemRecord | undefined;

  if (event.type !== 'updated') {
    return [
      {
        ...event,
        recipientUserWorkspaceIds: audienceOf(
          event.type === 'deleted' ? before : after,
          roleAssignments,
        ),
      },
    ];
  }

  const audienceBefore = audienceOf(before, roleAssignments);
  const audienceAfter = audienceOf(after, roleAssignments);

  if (!isDefined(audienceBefore) && !isDefined(audienceAfter)) {
    return [event];
  }

  const everyone = roleAssignments.map(
    ({ userWorkspaceId }) => userWorkspaceId,
  );
  const beforeSet = new Set(audienceBefore ?? everyone);
  const afterSet = new Set(audienceAfter ?? everyone);

  const kept = [...afterSet].filter((id) => beforeSet.has(id));
  const gained = [...afterSet].filter((id) => !beforeSet.has(id));
  const lost = [...beforeSet].filter((id) => !afterSet.has(id));

  return [
    { ...event, recipientUserWorkspaceIds: kept },
    {
      ...event,
      type: 'created' as const,
      properties: { after: event.properties.after },
      recipientUserWorkspaceIds: gained,
    },
    {
      ...event,
      type: 'deleted' as const,
      properties: { before: event.properties.before },
      recipientUserWorkspaceIds: lost,
    },
  ].filter(
    ({ recipientUserWorkspaceIds }) => recipientUserWorkspaceIds.length > 0,
  );
};
