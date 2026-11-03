import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  MONTHLY_INCOMES_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: MONTHLY_INCOMES_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'monthlyIncomes',
  label: 'Monthly Incomes',
  icon: 'IconCalendarDollar',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier:
    MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AGENT_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
