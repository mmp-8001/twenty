import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { MONTHLY_INCOME_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER, AUDIT_LOG_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/audit-log-monthly-income.field';

export default defineField({
  universalIdentifier: MONTHLY_INCOME_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'auditLogs',
  label: 'Audit logs',
  icon: 'IconHistory',
  relationTargetObjectMetadataUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: AUDIT_LOG_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
