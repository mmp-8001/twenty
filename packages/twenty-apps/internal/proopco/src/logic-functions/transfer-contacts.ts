import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { TRANSFER_CONTACTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { transferContacts } from 'src/logic-functions/utils/transfer-contacts.util';
import { resolveStaffCaller } from 'src/logic-functions/utils/code-caller.util';
import { refusalResponse } from 'src/logic-functions/utils/refusal.util';

export const handleTransferContacts = async (routePayload: RoutePayload<unknown>) => {
  try {
    const { context, caller } = await resolveStaffCaller(routePayload);

    const body = routePayload.body as Record<string, unknown> | null;

    return new Response(await transferContacts(context, { caller, personIds: body?.personIds, toAgentId: body?.toAgentId, reason: body?.reason, now: new Date() }));
  } catch (error) {
    return refusalResponse(error);
  }
};

export default defineLogicFunction({
  universalIdentifier: TRANSFER_CONTACTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'transfer-contacts',
  description: 'Supervisor or Full Admin: moves up to 50 contacts to another agent, one audited operation per contact.',
  timeoutSeconds: 120,
  handler: handleTransferContacts,
  httpRouteTriggerSettings: {
    path: '/contacts/transfer',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
