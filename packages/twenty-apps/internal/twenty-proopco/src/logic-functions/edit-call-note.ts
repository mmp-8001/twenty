import { isString } from '@sniptt/guards';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { EDIT_CALL_NOTE_ROUTE_PATH } from 'src/constants/ownership.constant';
import { EDIT_CALL_NOTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { editCallNote } from 'src/logic-functions/utils/record-call.util';
import {
  resolveCallerMemberId,
  SIGN_IN_REQUIRED_MESSAGE,
} from 'src/logic-functions/utils/resolve-caller.util';

export const editCallNoteHandler = async (routePayload: RoutePayload<unknown>) => {
  const memberId = await resolveCallerMemberId(routePayload);
  const { callId, note } = (routePayload.body ?? {}) as { callId?: unknown; note?: unknown };

  if (!memberId) {
    return { success: false, error: SIGN_IN_REQUIRED_MESSAGE };
  }

  if (!isString(callId) || (note !== null && !isString(note))) {
    return { success: false, error: 'callId and note are required' };
  }

  return editCallNote({
    client: new CoreApiClient({ runAs: 'application' }),
    memberId,
    callId,
    note: note === null || note.trim() === '' ? null : note,
  });
};

export default defineLogicFunction({
  universalIdentifier: EDIT_CALL_NOTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-edit-call-note',
  description: "Edits a Call's note. Only the Admin who made the call may.",
  timeoutSeconds: 15,
  handler: editCallNoteHandler,
  httpRouteTriggerSettings: {
    path: EDIT_CALL_NOTE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
