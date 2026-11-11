import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { CLAIM_CONTACT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { loadAgentActor } from 'src/logic-functions/utils/agent-actor.util';
import { claimContact } from 'src/logic-functions/utils/claim-contact.util';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { Refusal, refusalResponse } from 'src/logic-functions/utils/refusal.util';
import { resolveCallerMemberId } from 'src/logic-functions/utils/resolve-caller.util';

export const handleClaimContact = async (routePayload: RoutePayload<unknown>) => {
  try {
    const { client, metadata } = applicationClients();
    const actor = await loadAgentActor(client, await resolveCallerMemberId(routePayload));
    const personId = (routePayload.body as { personId?: unknown } | null)?.personId;

    if (typeof personId !== 'string') {
      throw new Refusal(400, 'CONTACT_REQUIRED', 'personId is required');
    }

    return new Response(await claimContact({ client, metadata, actor, personId, now: new Date() }));
  } catch (error) {
    return refusalResponse(error);
  }
};

export default defineLogicFunction({
  universalIdentifier: CLAIM_CONTACT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'claim-contact',
  description: 'Add to follow-up: the caller takes a free contact, or moves their own rebuy contact into follow-up.',
  timeoutSeconds: 60,
  handler: handleClaimContact,
  httpRouteTriggerSettings: {
    path: '/contacts/claim',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
