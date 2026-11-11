import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { EDIT_CALL_NOTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { loadAgentActor } from 'src/logic-functions/utils/agent-actor.util';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { editCallNote } from 'src/logic-functions/utils/edit-call-note.util';
import { refusalResponse } from 'src/logic-functions/utils/refusal.util';
import { resolveCallerMemberId } from 'src/logic-functions/utils/resolve-caller.util';

export const handleEditCallNote = async (routePayload: RoutePayload<unknown>) => {
  try {
    const { client } = applicationClients();
    const actor = await loadAgentActor(client, await resolveCallerMemberId(routePayload));
    const body = routePayload.body as Record<string, unknown> | null;

    return new Response(await editCallNote(client, actor, { callId: body?.callId, note: body?.note }, new Date()));
  } catch (error) {
    return refusalResponse(error);
  }
};

export default defineLogicFunction({
  universalIdentifier: EDIT_CALL_NOTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'edit-call-note',
  description: 'The author changes the note of a saved call; the previous text goes to the Audit log.',
  timeoutSeconds: 60,
  handler: handleEditCallNote,
  httpRouteTriggerSettings: {
    path: '/calls/edit-note',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
