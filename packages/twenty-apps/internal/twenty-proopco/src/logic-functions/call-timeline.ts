import {
  defineLogicFunction,
  type DatabaseEventPayload,
  type ObjectRecordCreateEvent,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { createTimelineActivity } from 'twenty-sdk/logic-function';

import {
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  CALL_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIER,
  CALL_TIMELINE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const callTimelineHandler = async (
  payload: DatabaseEventPayload<ObjectRecordCreateEvent<{ id: string; personId: string | null }>>,
) => {
  const { id, personId } = payload.properties.after;

  if (!personId) {
    return { processed: false };
  }

  await createTimelineActivity({
    timelineActivityTypeUniversalIdentifier:
      CALL_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIER,
    targetObjectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
    targetRecordId: personId,
    linkedRecordId: id,
    linkedObjectMetadataUniversalIdentifier: CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  });

  return { processed: true };
};

export default defineLogicFunction({
  universalIdentifier: CALL_TIMELINE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-call-timeline',
  description: 'Puts every new Call on the User timeline.',
  timeoutSeconds: 30,
  handler: callTimelineHandler,
  databaseEventTriggerSettings: { eventName: 'call.created' },
});
