import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const PURCHASE_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER =
  '138d8e59-d441-4d2b-bb74-f2c8ee2a077e';
export const MONTHLY_INCOME_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER =
  '8afb37f0-1692-4857-96f4-8373b84ce4e1';

export default defineField({
  universalIdentifier: PURCHASE_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'monthlyIncome',
  label: 'Monthly income',
  icon: 'IconCoin',
  relationTargetObjectMetadataUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: MONTHLY_INCOME_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'monthlyIncomeId',
  },
});
