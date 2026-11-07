import { defineTimelineActivityType } from 'twenty-sdk/define';

import {
  CALL_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIER,
  CALL_TIMELINE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineTimelineActivityType({
  universalIdentifier: CALL_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIER,
  name: 'call',
  label: 'made a call',
  icon: 'IconPhone',
  frontComponentUniversalIdentifier:
    CALL_TIMELINE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
});
