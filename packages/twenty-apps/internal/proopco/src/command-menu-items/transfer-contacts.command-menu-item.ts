import { defineCommandMenuItem, isSelectAll, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS, targetObjectReadPermissions } from 'twenty-sdk/define';

import {
  TRANSFER_CONTACTS_COMMAND_UNIVERSAL_IDENTIFIER,
  TRANSFER_CONTACTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Agents cannot read the Audit log, so that permission hides staff commands from them; the server still checks the role.
export default defineCommandMenuItem({
  universalIdentifier: TRANSFER_CONTACTS_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Transfer or release contacts',
  shortLabel: 'Transfer',
  isPinned: true,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  frontComponentUniversalIdentifier: TRANSFER_CONTACTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: !isSelectAll && targetObjectReadPermissions.auditLog,
});
