import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { RELEASE_CONTACTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { releaseContacts } from 'src/logic-functions/utils/transfer-contacts.util';
import { resolveStaffCaller } from 'src/logic-functions/utils/code-caller.util';
import { withRefusals } from 'src/logic-functions/utils/refusal.util';

export const handleReleaseContacts = async (routePayload: RoutePayload<unknown>) =>
  withRefusals(async () => {
    const { context, caller } = await resolveStaffCaller(routePayload);

    const body = routePayload.body as Record<string, unknown> | null;

    return new Response(await releaseContacts(context, { caller, personIds: body?.personIds, reason: body?.reason, now: new Date() }));
  });

export default defineLogicFunction({
  universalIdentifier: RELEASE_CONTACTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'release-contacts',
  description: 'Supervisor or Full Admin: frees up to 50 contacts without a cool-down, one audited operation per contact.',
  timeoutSeconds: 120,
  handler: handleReleaseContacts,
  httpRouteTriggerSettings: {
    path: '/contacts/release',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
