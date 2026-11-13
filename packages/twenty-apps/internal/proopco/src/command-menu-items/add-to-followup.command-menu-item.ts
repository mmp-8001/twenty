import {
  defineCommandMenuItem,
  isSelectAll,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ADD_TO_FOLLOW_UP_COMMAND_UNIVERSAL_IDENTIFIER,
  ADD_TO_FOLLOW_UP_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Offered on every contact; the server refuses what the caller cannot take (stage and owner are checked there).
export default defineCommandMenuItem({
  universalIdentifier: ADD_TO_FOLLOW_UP_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Add to follow-up',
  shortLabel: 'Add',
  isPinned: true,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  frontComponentUniversalIdentifier:
    ADD_TO_FOLLOW_UP_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: !isSelectAll,
});
