import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  FAILURE_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUPS_ON_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: FOLLOWUPS_ON_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: FAILURE_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'followups',
  label: 'Followups',
  icon: 'IconPhoneCheck',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    FOLLOWUP_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
