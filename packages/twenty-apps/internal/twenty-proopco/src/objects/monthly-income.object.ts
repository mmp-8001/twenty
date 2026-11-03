import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  AGENT_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_PAYOUT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_TOTAL_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOMES_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'monthlyIncome',
  namePlural: 'monthlyIncomes',
  labelSingular: 'Monthly Income',
  labelPlural: 'Monthly Incomes',
  description: "One agent's Commissions for one month.",
  icon: 'IconCalendarDollar',
  isUICreatable: false,
  labelIdentifierFieldMetadataUniversalIdentifier:
    MONTHLY_INCOME_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: MONTHLY_INCOME_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconTag',
    },
    {
      universalIdentifier: MONTHLY_INCOME_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'month',
      label: 'Month',
      description: 'YYYY-MM, in UTC.',
      icon: 'IconCalendarMonth',
    },
    {
      universalIdentifier: MONTHLY_INCOME_TOTAL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'total',
      label: 'Total',
      icon: 'IconCurrencyDollar',
      isNullable: true,
    },
    {
      universalIdentifier:
        MONTHLY_INCOME_PAYOUT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'payoutStatus',
      label: 'Payout status',
      icon: 'IconProgress',
      defaultValue: "'PENDING'",
      options: [
        { id: '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c01', value: 'PENDING', label: 'Pending', position: 0, color: 'orange' },
        { id: '1b2c3d4e-5f6a-4b7c-9d8e-0f1a2b3c4d02', value: 'PAID', label: 'Paid', position: 1, color: 'green' },
      ],
    },
    {
      universalIdentifier: AGENT_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'agent',
      label: 'Agent',
      icon: 'IconUserCircle',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember
          .universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        MONTHLY_INCOMES_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'agentId',
      },
    },
    {
      universalIdentifier: COMMISSIONS_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'commissions',
      label: 'Commissions',
      icon: 'IconCoin',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        MONTHLY_INCOME_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: { relationType: RelationType.ONE_TO_MANY },
    },
  ],
});
