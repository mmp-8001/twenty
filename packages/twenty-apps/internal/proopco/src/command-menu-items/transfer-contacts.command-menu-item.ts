import {
  defineCommandMenuItem,
  isSelectAll,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  TRANSFER_CONTACTS_COMMAND_UNIVERSAL_IDENTIFIER,
  TRANSFER_CONTACTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Offered on every person; the server refuses what the caller may not do.
export default defineCommandMenuItem({
  universalIdentifier: TRANSFER_CONTACTS_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Transfer or release contacts',
  shortLabel: 'Transfer',
  isPinned: true,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  frontComponentUniversalIdentifier: TRANSFER_CONTACTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: !isSelectAll,
});
