import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { WORKSPACE_MEMBER_PAID_MONTHLY_INCOMES_FIELD_UNIVERSAL_IDENTIFIER, MONTHLY_INCOME_PAID_BY_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/monthly-income-paid-by.field';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_PAID_MONTHLY_INCOMES_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'paidMonthlyIncomes',
  label: 'Monthly incomes (paid)',
  icon: 'IconCoin',
  relationTargetObjectMetadataUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: MONTHLY_INCOME_PAID_BY_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
