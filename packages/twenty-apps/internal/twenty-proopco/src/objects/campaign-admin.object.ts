import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ADMIN_ON_CAMPAIGN_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ADMIN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ADMIN_REMOVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ADMINS_ON_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ADMINS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ON_CAMPAIGN_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Assigned by and at are the record's createdBy and createdAt.
export default defineObject({
  universalIdentifier: CAMPAIGN_ADMIN_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'campaignAdmin',
  namePlural: 'campaignAdmins',
  labelSingular: 'Campaign Agent',
  labelPlural: 'Campaign Agents',
  description: 'An Agent assigned to a Campaign. Removal sets Removed at; the record stays.',
  icon: 'IconUserPlus',
  disabledObjectPermissionActions: [
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  fields: [
    {
      universalIdentifier: CAMPAIGN_ADMIN_REMOVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'removedAt',
      label: 'Removed at',
      description: 'Set when the Agent is taken off the Campaign.',
      icon: 'IconUserMinus',
      isNullable: true,
    },
    {
      universalIdentifier: CAMPAIGN_ON_CAMPAIGN_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'campaign',
      label: 'Campaign',
      icon: 'IconSpeakerphone',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CAMPAIGN_ADMINS_ON_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'campaignId',
      },
    },
    {
      universalIdentifier: ADMIN_ON_CAMPAIGN_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'admin',
      label: 'Agent',
      icon: 'IconHeadset',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        CAMPAIGN_ADMINS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'adminId',
      },
    },
  ],
});
