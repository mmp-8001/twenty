import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  FOLLOWUP_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUPS_ON_FOLLOWUP_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  TYPE_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: FOLLOWUPS_ON_FOLLOWUP_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: FOLLOWUP_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'followups',
  label: 'Followups',
  icon: 'IconPhoneCall',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier:
    FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    TYPE_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
