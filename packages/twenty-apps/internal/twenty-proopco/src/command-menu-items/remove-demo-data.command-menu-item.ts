import { defineCommandMenuItem } from 'twenty-sdk/define';

import {
  REMOVE_DEMO_DATA_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  REMOVE_DEMO_DATA_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: REMOVE_DEMO_DATA_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier:
    REMOVE_DEMO_DATA_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  label: 'Remove demo data',
  availabilityType: 'GLOBAL',
});
