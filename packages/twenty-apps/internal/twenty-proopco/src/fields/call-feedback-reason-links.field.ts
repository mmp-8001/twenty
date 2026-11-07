import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  CALL_FEEDBACK_REASON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  CALL_FEEDBACK_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_LINKS_ON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: FEEDBACK_REASON_LINKS_ON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'feedbackReasonLinks',
  label: 'Feedback reasons',
  icon: 'IconMoodSmile',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: CALL_FEEDBACK_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CALL_FEEDBACK_REASON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
