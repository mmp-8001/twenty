import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  FEEDBACK_REASON_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_IS_OTHER_FIELD_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_SENTIMENT_FIELD_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_SORT_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { buildSelectOptions } from 'src/utils/build-select-options.util';

export default defineObject({
  universalIdentifier: FEEDBACK_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'feedbackReason',
  namePlural: 'feedbackReasons',
  labelSingular: 'Feedback Reason',
  labelPlural: 'Feedback Reasons',
  description: 'Why a User was satisfied or dissatisfied on a call. Deactivate, never delete.',
  icon: 'IconMoodSmile',
  disabledObjectPermissionActions: [
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  labelIdentifierFieldMetadataUniversalIdentifier:
    FEEDBACK_REASON_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: FEEDBACK_REASON_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'title',
      label: 'Title',
      icon: 'IconTag',
    },
    {
      universalIdentifier: FEEDBACK_REASON_SENTIMENT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'sentiment',
      label: 'Sentiment',
      icon: 'IconMoodSmile',
      defaultValue: "'NEGATIVE'",
      options: buildSelectOptions('feedbackReason.sentiment', ['POSITIVE', 'NEGATIVE']),
    },
    {
      universalIdentifier: FEEDBACK_REASON_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'category',
      label: 'Category',
      icon: 'IconCategory',
      isNullable: true,
    },
    {
      universalIdentifier: FEEDBACK_REASON_IS_OTHER_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.BOOLEAN,
      name: 'isOther',
      label: 'Is other',
      description: 'Choosing this reason requires free text.',
      icon: 'IconDots',
      defaultValue: false,
    },
    {
      universalIdentifier: FEEDBACK_REASON_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.BOOLEAN,
      name: 'isActive',
      label: 'Active',
      icon: 'IconToggleRight',
      defaultValue: true,
    },
    {
      universalIdentifier: FEEDBACK_REASON_SORT_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'sortOrder',
      label: 'Sort order',
      icon: 'IconSortAscending',
      defaultValue: 0,
    },
  ],
});
