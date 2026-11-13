import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { AUDIT_LOG_CALL_FIELD_UNIVERSAL_IDENTIFIER, CALL_AUDIT_LOG_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/audit-log-call.field';

export default defineField({
  universalIdentifier: CALL_AUDIT_LOG_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'auditLogs',
  label: 'Audit logs',
  icon: 'IconPhone',
  relationTargetObjectMetadataUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: AUDIT_LOG_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
