import {
  defineCommandMenuItem,
  isDefined,
  numberOfSelectedRecords,
  selectedRecords,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CALL_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  CALL_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Only an owned User has the button; the route refuses anyone but the owner.
export default defineCommandMenuItem({
  universalIdentifier: CALL_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  availabilityObjectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  frontComponentUniversalIdentifier: CALL_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  label: 'Call',
  availabilityType: 'RECORD_SELECTION',
  conditionalAvailabilityExpression:
    numberOfSelectedRecords === 1 && isDefined(selectedRecords[0].currentOwnerId),
});
