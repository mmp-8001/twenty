import { isDefined } from 'twenty-sdk/utils';

import { type AgentActor } from 'src/logic-functions/utils/agent-actor.util';
import { createAudit } from 'src/logic-functions/utils/audit-log.util';
import {
  listRecords,
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';

// Only the note of a saved call can change, only by its author, and the old text is kept in the Audit log.
export const editCallNote = async (
  client: RecordsClient,
  actor: AgentActor,
  { callId, note }: { callId: unknown; note: unknown },
  now: Date,
) => {
  if (typeof callId !== 'string' || typeof note !== 'string') {
    throw new Refusal(400, 'INVALID_BODY', 'callId and note are required');
  }

  const [call] = await listRecords<{ agentId: string | null; note: string | null; contactId: string | null }>(
    client,
    'calls',
    { id: { eq: callId } },
    { agentId: true, note: true, contactId: true },
    1,
  );

  if (!isDefined(call)) {
    throw new Refusal(404, 'CALL_NOT_FOUND', 'Call not found.');
  }

  if (call.agentId !== actor.agentId) {
    throw new Refusal(403, 'NOT_AUTHOR', 'Only the author can edit this note.');
  }

  const written = await updateRecordsWhere(
    client,
    'Calls',
    { and: [{ id: { eq: callId } }, { agentId: { eq: actor.agentId } }] },
    { note, noteEditedAt: now.toISOString() },
  );

  if (written.length === 0) {
    throw new Refusal(409, 'CALL_CHANGED', 'The call changed. Try again.');
  }

  await createAudit(
    client,
    {
      name: `Note edited · ${actor.name}`,
      action: 'NOTE_EDITED',
      actor: { memberId: actor.memberId, name: actor.name },
      effectiveAt: now,
      links: { callId, contactId: call.contactId, subjectAgentId: actor.agentId },
      details: { previousNote: call.note },
    },
    'DONE',
  );

  return { callId };
};
