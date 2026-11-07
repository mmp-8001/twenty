import { defineView, ViewType } from 'twenty-sdk/define';

import {
  FEEDBACK_REASONS_VIEW_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_IS_OTHER_FIELD_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_SENTIMENT_FIELD_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_SORT_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: FEEDBACK_REASONS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Feedback Reasons',
  objectUniversalIdentifier: FEEDBACK_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconMoodSmile',
  position: 0,
  fields: [
    {
      universalIdentifier: '0fa17147-521c-4a42-b6ed-da960c840da3',
      fieldMetadataUniversalIdentifier: FEEDBACK_REASON_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'cb6f8160-3b53-4a0b-8ee7-ac72c5662e27',
      fieldMetadataUniversalIdentifier: FEEDBACK_REASON_SENTIMENT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'a39a1646-2693-4145-a1e8-e8a7741bec5c',
      fieldMetadataUniversalIdentifier: FEEDBACK_REASON_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '0558ef19-cfda-40ed-baf6-baa9e5757be5',
      fieldMetadataUniversalIdentifier: FEEDBACK_REASON_IS_OTHER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '7757c6f0-b1f3-426e-a1e1-dd6c3229e9bf',
      fieldMetadataUniversalIdentifier: FEEDBACK_REASON_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'e6122fb4-79df-4311-afc3-30078b02e926',
      fieldMetadataUniversalIdentifier: FEEDBACK_REASON_SORT_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 160,
    },
  ],
});
