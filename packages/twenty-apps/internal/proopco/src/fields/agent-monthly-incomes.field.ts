import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { AGENT_MONTHLY_INCOMES_FIELD_UNIVERSAL_IDENTIFIER, MONTHLY_INCOME_AGENT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/monthly-income-agent.field';

export default defineField({
  universalIdentifier: AGENT_MONTHLY_INCOMES_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'monthlyIncomes',
  label: 'Monthly incomes',
  icon: 'IconCoin',
  relationTargetObjectMetadataUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: MONTHLY_INCOME_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
