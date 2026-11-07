import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  AUDIT_LOGS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  AUDIT_LOG_ACTOR_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: AUDIT_LOGS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'auditLogs',
  label: 'Audit log',
  icon: 'IconHistory',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: AUDIT_LOG_ACTOR_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
