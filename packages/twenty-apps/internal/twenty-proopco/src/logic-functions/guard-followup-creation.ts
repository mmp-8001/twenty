import { CoreApiClient } from 'twenty-client-sdk/core';
import {
  defineLogicFunction,
  type DatabaseEventPayload,
  type ObjectRecordBaseEvent,
} from 'twenty-sdk/define';

import { PROOPCO_FOLLOWUP_CREATE_GUARD_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

type FollowupSnapshot = Record<string, unknown> & {
  createdBy?: { source?: string };
};

// Create rides on update permission and there is no pre-create hook, so a Followup
// made outside Track is removed after the fact. API keys are integrations, not agents.
const ALLOWED_CREATE_SOURCES = ['APPLICATION', 'API'];

export const guardFollowupCreationHandler = async (
  event: DatabaseEventPayload<ObjectRecordBaseEvent<FollowupSnapshot>>,
) => {
  const source = event.properties.after?.createdBy?.source;

  if (source === undefined || ALLOWED_CREATE_SOURCES.includes(source)) {
    return { removed: false };
  }

  await new CoreApiClient({ runAs: 'application' }).mutation({
    destroyFollowup: { __args: { id: event.recordId }, id: true },
  });

  return { removed: true };
};

export default defineLogicFunction({
  universalIdentifier:
    PROOPCO_FOLLOWUP_CREATE_GUARD_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-guard-followup-creation',
  description: 'Removes Followups created outside Track.',
  timeoutSeconds: 30,
  handler: guardFollowupCreationHandler,
  databaseEventTriggerSettings: { eventName: 'followup.created' },
});
