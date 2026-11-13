import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { AUDIT_LOG_ACTOR_FIELD_UNIVERSAL_IDENTIFIER, WORKSPACEMEMBER_AUDIT_LOG_ACTED_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/audit-log-actor.field';

export default defineField({
  universalIdentifier: WORKSPACEMEMBER_AUDIT_LOG_ACTED_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'actedAuditLogs',
  label: 'Audit logs (actor)',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: AUDIT_LOG_ACTOR_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
