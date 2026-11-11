import { defineCommandMenuItem, isSelectAll } from 'twenty-sdk/define';

import {
  RESEND_SMS_COMMAND_UNIVERSAL_IDENTIFIER,
  RESEND_SMS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: RESEND_SMS_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Resend SMS',
  shortLabel: 'Resend SMS',
  isPinned: true,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier: CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: RESEND_SMS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: !isSelectAll,
});
