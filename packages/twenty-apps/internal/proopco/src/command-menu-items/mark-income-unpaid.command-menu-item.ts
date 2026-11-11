import { defineCommandMenuItem, isSelectAll } from 'twenty-sdk/define';

import {
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  MARK_INCOME_UNPAID_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  MARK_INCOME_UNPAID_COMMAND_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: MARK_INCOME_UNPAID_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Undo paid',
  shortLabel: 'Undo paid',
  isPinned: true,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: MARK_INCOME_UNPAID_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: !isSelectAll,
});
