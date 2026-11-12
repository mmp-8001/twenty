import { defineCommandMenuItem, targetObjectWritePermissions } from 'twenty-sdk/define';

import {
  CREATE_DISCOUNT_CODE_COMMAND_UNIVERSAL_IDENTIFIER,
  CREATE_DISCOUNT_CODE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Only the Full Admin can write Proopco settings, so that permission stands in for the role here; the server checks the role itself.
export default defineCommandMenuItem({
  universalIdentifier: CREATE_DISCOUNT_CODE_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Create code',
  shortLabel: 'Create code',
  isPinned: true,
  availabilityType: 'GLOBAL_OBJECT_CONTEXT',
  availabilityObjectUniversalIdentifier: DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: CREATE_DISCOUNT_CODE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: targetObjectWritePermissions.proopcoSettings,
});
