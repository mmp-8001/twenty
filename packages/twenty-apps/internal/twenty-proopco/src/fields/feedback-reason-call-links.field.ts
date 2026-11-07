import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  CALL_FEEDBACK_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  CALL_FEEDBACK_REASON_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  CALL_LINKS_ON_FEEDBACK_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: CALL_LINKS_ON_FEEDBACK_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: FEEDBACK_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'callLinks',
  label: 'Calls',
  icon: 'IconPhone',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: CALL_FEEDBACK_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CALL_FEEDBACK_REASON_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
