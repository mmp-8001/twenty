import { defineCommandMenuItem } from 'twenty-sdk/define';

import {
  RESET_SIDEBAR_COMMAND_UNIVERSAL_IDENTIFIER,
  RESET_SIDEBAR_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: RESET_SIDEBAR_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Reset my sidebar',
  shortLabel: 'Reset sidebar',
  availabilityType: 'GLOBAL',
  frontComponentUniversalIdentifier: RESET_SIDEBAR_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
});
