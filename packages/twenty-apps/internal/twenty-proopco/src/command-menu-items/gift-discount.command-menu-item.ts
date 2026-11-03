import {
  defineCommandMenuItem,
  numberOfSelectedRecords,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  GIFT_DISCOUNT_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  GIFT_DISCOUNT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: GIFT_DISCOUNT_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  availabilityObjectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  frontComponentUniversalIdentifier:
    GIFT_DISCOUNT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  label: 'Gift discount code',
  availabilityType: 'RECORD_SELECTION',
  conditionalAvailabilityExpression: numberOfSelectedRecords === 1,
});
