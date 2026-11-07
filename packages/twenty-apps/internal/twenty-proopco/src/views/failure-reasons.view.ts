import { defineView, ViewType } from 'twenty-sdk/define';

import {
  FAILURE_REASONS_VIEW_UNIVERSAL_IDENTIFIER,
  FAILURE_REASON_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
  FAILURE_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  FAILURE_REASON_SORT_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
  FAILURE_REASON_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: FAILURE_REASONS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Failure Reasons',
  objectUniversalIdentifier: FAILURE_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconFlag',
  position: 0,
  fields: [
    {
      universalIdentifier: '5e110cef-9bf8-49ff-8adc-0d2ad7ce2785',
      fieldMetadataUniversalIdentifier: FAILURE_REASON_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '1ea7e046-5bf1-4902-b937-c1e589a2f5b4',
      fieldMetadataUniversalIdentifier: FAILURE_REASON_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '13a28b03-a4ff-4e01-b51e-db117b115342',
      fieldMetadataUniversalIdentifier: FAILURE_REASON_SORT_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
  ],
});
