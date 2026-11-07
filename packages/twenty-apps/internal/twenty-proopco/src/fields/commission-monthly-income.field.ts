import { defineField, FieldType, OnDeleteAction, RelationType } from 'twenty-sdk/define';

import {
  COMMISSION_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Empty until the monthly rollup claims the Commission.
export default defineField({
  universalIdentifier: COMMISSION_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'monthlyIncome',
  label: 'Monthly income',
  icon: 'IconCoin',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: COMMISSIONS_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'monthlyIncomeId',
  },
});
