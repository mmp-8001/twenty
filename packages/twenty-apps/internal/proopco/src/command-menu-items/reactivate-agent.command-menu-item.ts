import { defineCommandMenuItem, isSelectAll, targetObjectWritePermissions } from 'twenty-sdk/define';

import {
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  REACTIVATE_AGENT_COMMAND_UNIVERSAL_IDENTIFIER,
  REACTIVATE_AGENT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: REACTIVATE_AGENT_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Reactivate agent',
  shortLabel: 'Reactivate agent',
  isPinned: true,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: REACTIVATE_AGENT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: !isSelectAll && targetObjectWritePermissions.proopcoSettings,
});
