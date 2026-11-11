import { defineCommandMenuItem, isSelectAll } from 'twenty-sdk/define';

import {
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  UNFREEZE_AGENT_COMMAND_UNIVERSAL_IDENTIFIER,
  UNFREEZE_AGENT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: UNFREEZE_AGENT_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Unfreeze agent',
  shortLabel: 'Unfreeze agent',
  isPinned: true,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: UNFREEZE_AGENT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: !isSelectAll,
});
