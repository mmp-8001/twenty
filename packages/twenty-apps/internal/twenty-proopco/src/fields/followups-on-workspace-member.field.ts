import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  FOLLOWUPS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  OWNER_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: FOLLOWUPS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'followups',
  label: 'Followups',
  icon: 'IconPhoneCall',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier:
    FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    OWNER_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
