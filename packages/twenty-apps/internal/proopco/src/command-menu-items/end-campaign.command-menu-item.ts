import { defineCommandMenuItem, isSelectAll } from 'twenty-sdk/define';

import {
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  END_CAMPAIGN_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  END_CAMPAIGN_COMMAND_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: END_CAMPAIGN_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'End now',
  shortLabel: 'End now',
  isPinned: true,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier: CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: END_CAMPAIGN_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: !isSelectAll,
});
