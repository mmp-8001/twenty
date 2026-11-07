import { defineView, ViewType } from 'twenty-sdk/define';

import {
  OWNERSHIP_OBJECT_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_STARTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_STATE_FIELD_UNIVERSAL_IDENTIFIER,
  SUCCESSFUL_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
  SUCCESSFUL_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
  SUCCESSFUL_VIEW_FILTER_1_UNIVERSAL_IDENTIFIER,
  SUCCESSFUL_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// shortcut: one list of kept Users; the with/without retention time tabs and attributed-purchase columns come with the reports.
export default defineView({
  universalIdentifier: SUCCESSFUL_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Successful',
  objectUniversalIdentifier: OWNERSHIP_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconTrophy',
  position: 2,
  fields: [
    {
      universalIdentifier: SUCCESSFUL_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: OWNERSHIP_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: SUCCESSFUL_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: OWNERSHIP_STARTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
  ],
  filters: [
    {
      universalIdentifier: SUCCESSFUL_VIEW_FILTER_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: OWNERSHIP_STATE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'IS',
      value: ['SUCCESSFUL'],
    },
  ],
});
