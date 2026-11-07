import { defineView, ViewType } from 'twenty-sdk/define';

import {
  FOLLOWUP_ADDED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_DEADLINE_AT_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  REBUY_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
  REBUY_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
  REBUY_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
  REBUY_VIEW_FILTER_1_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// shortcut: the deadline column is the countdown (a date, not a live timer); upgrade with a front component if admins need one.
export default defineView({
  universalIdentifier: REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Rebuy list',
  objectUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconRefresh',
  position: 1,
  fields: [
    {
      universalIdentifier: REBUY_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: FOLLOWUP_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: REBUY_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: FOLLOWUP_ADDED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: REBUY_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: FOLLOWUP_DEADLINE_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
  ],
  filters: [
    {
      universalIdentifier: REBUY_VIEW_FILTER_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: FOLLOWUP_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'IS',
      value: ['REBUY_PENDING'],
    },
  ],
});
