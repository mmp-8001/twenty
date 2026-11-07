import { defineCommandMenuItem } from 'twenty-sdk/define';

import {
  SEED_DEMO_DATA_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  SEED_DEMO_DATA_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: SEED_DEMO_DATA_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: SEED_DEMO_DATA_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  label: 'Seed demo data',
  availabilityType: 'GLOBAL',
});
