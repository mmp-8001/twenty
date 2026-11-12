import { defineCommandMenuItem, isSelectAll, targetObjectReadPermissions } from 'twenty-sdk/define';

import {
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  FREEZE_AGENT_COMMAND_UNIVERSAL_IDENTIFIER,
  FREEZE_AGENT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: FREEZE_AGENT_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Freeze agent',
  shortLabel: 'Freeze agent',
  isPinned: true,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: FREEZE_AGENT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: !isSelectAll && targetObjectReadPermissions.auditLog,
});
