import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUPS_ON_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: FOLLOWUPS_ON_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'followups',
  label: 'Followups',
  icon: 'IconPhoneCheck',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    FOLLOWUP_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
