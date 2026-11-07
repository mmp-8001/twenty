import { defineView, ViewType } from 'twenty-sdk/define';

import {
  FOLLOWUP_CLOSED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  HISTORY_FILTER_1_UNIVERSAL_IDENTIFIER,
  HISTORY_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
  HISTORY_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
  HISTORY_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
  HISTORY_VIEW_FIELD_4_UNIVERSAL_IDENTIFIER,
  HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'History',
  objectUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconHistory',
  position: 5,
  fields: [
    {
      universalIdentifier: HISTORY_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: FOLLOWUP_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: HISTORY_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: FOLLOWUP_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: HISTORY_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: FOLLOWUP_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: HISTORY_VIEW_FIELD_4_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: FOLLOWUP_CLOSED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 160,
    },
  ],
  filters: [
    {
      universalIdentifier: HISTORY_FILTER_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: FOLLOWUP_CLOSED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'IS_NOT_EMPTY',
      value: '',
    },
  ],
});
