import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { type RoutePayload } from 'twenty-sdk/define';

import { isDefined } from 'src/utils/is-defined';

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
