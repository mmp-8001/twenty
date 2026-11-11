import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const AUDIT_LOG_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER =
  'c962a885-4cd1-4411-ba5c-83b0e57aa841';
export const MONTHLY_INCOME_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER =
  'c651400f-afec-4b67-ac3b-51bcdeb3cf94';

export default defineField({
  universalIdentifier: AUDIT_LOG_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'monthlyIncome',
  label: 'Monthly income',
  icon: 'IconCoin',
  relationTargetObjectMetadataUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: MONTHLY_INCOME_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'monthlyIncomeId',
  },
});
