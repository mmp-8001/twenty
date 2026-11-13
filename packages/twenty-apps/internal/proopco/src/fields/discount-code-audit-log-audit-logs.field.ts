import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  AUDIT_LOG_DISCOUNT_CODE_FIELD_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_AUDIT_LOG_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/audit-log-discount-code.field';

export default defineField({
  universalIdentifier: DISCOUNT_CODE_AUDIT_LOG_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'auditLogs',
  label: 'Audit logs',
  icon: 'IconTicket',
  relationTargetObjectMetadataUniversalIdentifier:
    AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AUDIT_LOG_DISCOUNT_CODE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
