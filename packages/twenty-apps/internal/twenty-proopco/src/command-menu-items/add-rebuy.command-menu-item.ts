import {
  defineCommandMenuItem,
  numberOfSelectedRecords,
} from 'twenty-sdk/define';

import {
  ADD_REBUY_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  ADD_REBUY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// The only action on the Rebuy list.
export default defineCommandMenuItem({
  universalIdentifier: ADD_REBUY_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  availabilityObjectUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: ADD_REBUY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  label: 'Add to follow-up',
  availabilityType: 'RECORD_SELECTION',
  conditionalAvailabilityExpression: numberOfSelectedRecords === 1,
});
