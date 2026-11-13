import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { AUDIT_LOG_SUBJECT_AGENT_FIELD_UNIVERSAL_IDENTIFIER, AGENT_AUDIT_LOG_SUBJECT_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/audit-log-subject-agent.field';

export default defineField({
  universalIdentifier: AGENT_AUDIT_LOG_SUBJECT_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'subjectAuditLogs',
  label: 'Audit logs (subject)',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: AUDIT_LOG_SUBJECT_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
