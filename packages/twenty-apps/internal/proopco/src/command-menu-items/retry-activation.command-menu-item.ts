import { defineCommandMenuItem, isSelectAll } from 'twenty-sdk/define';

import {
  RETRY_ACTIVATION_COMMAND_UNIVERSAL_IDENTIFIER,
  RETRY_ACTIVATION_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: RETRY_ACTIVATION_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Retry',
  shortLabel: 'Retry',
  isPinned: true,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier: CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: RETRY_ACTIVATION_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: !isSelectAll,
});
