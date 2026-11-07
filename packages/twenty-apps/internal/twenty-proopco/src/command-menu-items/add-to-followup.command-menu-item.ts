import {
  defineCommandMenuItem,
  isDefined,
  numberOfSelectedRecords,
  selectedRecords,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ADD_TO_FOLLOWUP_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  ADD_TO_FOLLOWUP_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// One User at a time, and only while nobody owns it.
export default defineCommandMenuItem({
  universalIdentifier: ADD_TO_FOLLOWUP_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  availabilityObjectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  frontComponentUniversalIdentifier:
    ADD_TO_FOLLOWUP_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  label: 'Add to follow-up',
  availabilityType: 'RECORD_SELECTION',
  conditionalAvailabilityExpression:
    numberOfSelectedRecords === 1 && !isDefined(selectedRecords[0].currentOwnerId),
});
