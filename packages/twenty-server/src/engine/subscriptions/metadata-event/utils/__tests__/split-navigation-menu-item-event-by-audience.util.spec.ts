import { splitNavigationMenuItemEventByAudience } from 'src/engine/subscriptions/metadata-event/utils/split-navigation-menu-item-event-by-audience.util';
import { type WorkspaceBroadcastEvent } from 'src/engine/subscriptions/workspace-event-broadcaster/types/workspace-broadcast-event.type';

const ROLE_ASSIGNMENTS = [
  { userWorkspaceId: 'agent-user', roleUniversalIdentifier: 'agent-role' },
  { userWorkspaceId: 'admin-user', roleUniversalIdentifier: 'admin-role' },
];

const buildEvent = (
  type: WorkspaceBroadcastEvent['type'],
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined,
): WorkspaceBroadcastEvent => ({
  type,
  entityName: 'navigationMenuItem',
  recordId: 'item',
  properties: { before, after },
});

const summarize = (events: WorkspaceBroadcastEvent[]) =>
  events.map(({ type, recipientUserWorkspaceIds }) => [
    type,
    recipientUserWorkspaceIds,
  ]);

describe('splitNavigationMenuItemEventByAudience', () => {
  it('sends a workspace item with no role list to everyone', () => {
    const event = buildEvent('created', undefined, {
      visibleToRoleUniversalIdentifiers: null,
    });

    expect(
      summarize(
        splitNavigationMenuItemEventByAudience(event, ROLE_ASSIGNMENTS),
      ),
    ).toEqual([['created', undefined]]);
  });

  it('sends a role-limited item only to users holding one of its roles', () => {
    const event = buildEvent('created', undefined, {
      visibleToRoleUniversalIdentifiers: ['agent-role'],
    });

    expect(
      summarize(
        splitNavigationMenuItemEventByAudience(event, ROLE_ASSIGNMENTS),
      ),
    ).toEqual([['created', ['agent-user']]]);
  });

  it('sends a personal item only to its owner', () => {
    const event = buildEvent(
      'deleted',
      { userWorkspaceId: 'admin-user' },
      undefined,
    );

    expect(
      summarize(
        splitNavigationMenuItemEventByAudience(event, ROLE_ASSIGNMENTS),
      ),
    ).toEqual([['deleted', ['admin-user']]]);
  });

  it('turns a narrowing update into a delete for users who lose the item', () => {
    const event = buildEvent(
      'updated',
      { visibleToRoleUniversalIdentifiers: null },
      { visibleToRoleUniversalIdentifiers: ['agent-role'] },
    );

    expect(
      summarize(
        splitNavigationMenuItemEventByAudience(event, ROLE_ASSIGNMENTS),
      ),
    ).toEqual([
      ['updated', ['agent-user']],
      ['deleted', ['admin-user']],
    ]);
  });

  it('turns a widening update into a create for users who gain the item', () => {
    const event = buildEvent(
      'updated',
      { visibleToRoleUniversalIdentifiers: ['agent-role'] },
      { visibleToRoleUniversalIdentifiers: ['agent-role', 'admin-role'] },
    );

    expect(
      summarize(
        splitNavigationMenuItemEventByAudience(event, ROLE_ASSIGNMENTS),
      ),
    ).toEqual([
      ['updated', ['agent-user']],
      ['created', ['admin-user']],
    ]);
  });
});
