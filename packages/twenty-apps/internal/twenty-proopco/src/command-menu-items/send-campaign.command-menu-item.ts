import {
  defineCommandMenuItem,
  numberOfSelectedRecords,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  SEND_CAMPAIGN_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  SEND_CAMPAIGN_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: SEND_CAMPAIGN_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  availabilityObjectUniversalIdentifier: CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier:
    SEND_CAMPAIGN_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  label: 'Send campaign',
  availabilityType: 'RECORD_SELECTION',
  conditionalAvailabilityExpression: numberOfSelectedRecords === 1,
});
