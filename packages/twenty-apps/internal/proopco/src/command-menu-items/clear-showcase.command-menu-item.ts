import { defineCommandMenuItem, targetObjectReadPermissions } from 'twenty-sdk/define';

import {
  CLEAR_SHOWCASE_COMMAND_UNIVERSAL_IDENTIFIER,
  CLEAR_SHOWCASE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: CLEAR_SHOWCASE_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Clear showcase data',
  shortLabel: 'Clear showcase',
  availabilityType: 'GLOBAL',
  frontComponentUniversalIdentifier: CLEAR_SHOWCASE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: targetObjectReadPermissions.platformEventInbox,
});
