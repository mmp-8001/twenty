import { defineCommandMenuItem } from 'twenty-sdk/define';

import {
  CREATE_DISCOUNT_CODE_COMMAND_UNIVERSAL_IDENTIFIER,
  CREATE_DISCOUNT_CODE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Offered to everyone who sees the object; the server refuses anyone but a Full Admin.
export default defineCommandMenuItem({
  universalIdentifier: CREATE_DISCOUNT_CODE_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Create code',
  shortLabel: 'Create code',
  isPinned: true,
  availabilityType: 'GLOBAL_OBJECT_CONTEXT',
  availabilityObjectUniversalIdentifier: DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: CREATE_DISCOUNT_CODE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
});
