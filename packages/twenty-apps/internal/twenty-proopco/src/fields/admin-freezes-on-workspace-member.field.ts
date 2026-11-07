import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ADMIN_FREEZES_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  ADMIN_FREEZE_OBJECT_UNIVERSAL_IDENTIFIER,
  ADMIN_FREEZE_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: ADMIN_FREEZES_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'adminFreezes',
  label: 'Admin freezes',
  icon: 'IconSnowflake',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: ADMIN_FREEZE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: ADMIN_FREEZE_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
