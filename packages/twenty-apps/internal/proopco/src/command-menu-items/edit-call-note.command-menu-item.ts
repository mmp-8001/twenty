import {
  defineCommandMenuItem,
  isSelectAll,
} from 'twenty-sdk/define';

import {
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  EDIT_CALL_NOTE_COMMAND_UNIVERSAL_IDENTIFIER,
  EDIT_CALL_NOTE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Offered on every call; the server refuses what the caller may not do.
export default defineCommandMenuItem({
  universalIdentifier: EDIT_CALL_NOTE_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Edit note',
  shortLabel: 'Edit note',
  isPinned: true,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier: CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: EDIT_CALL_NOTE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: !isSelectAll,
});
