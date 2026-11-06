import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ADMIN_ON_CAMPAIGN_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ADMIN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ADMINS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier:
    CAMPAIGN_ADMINS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'campaignAssignments',
  label: 'Campaign assignments',
  description: 'Campaigns assigned to this admin.',
  icon: 'IconSpeakerphone',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier:
    CAMPAIGN_ADMIN_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    ADMIN_ON_CAMPAIGN_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
