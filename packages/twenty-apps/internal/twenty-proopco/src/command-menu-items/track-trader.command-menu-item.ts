import {
  defineCommandMenuItem,
  numberOfSelectedRecords,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  TRACK_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  TRACK_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: TRACK_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  availabilityObjectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  frontComponentUniversalIdentifier:
    TRACK_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  label: 'Track',
  availabilityType: 'RECORD_SELECTION',
  conditionalAvailabilityExpression: numberOfSelectedRecords === 1,
});
