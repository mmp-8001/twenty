import { defineCommandMenuItem, isSelectAll, targetObjectWritePermissions } from 'twenty-sdk/define';

import {
  DEACTIVATE_DISCOUNT_CODE_COMMAND_UNIVERSAL_IDENTIFIER,
  DEACTIVATE_DISCOUNT_CODE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: DEACTIVATE_DISCOUNT_CODE_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Deactivate code',
  shortLabel: 'Deactivate code',
  isPinned: true,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier: DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: DEACTIVATE_DISCOUNT_CODE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: !isSelectAll && targetObjectWritePermissions.proopcoSettings,
});
