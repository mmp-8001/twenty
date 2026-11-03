import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  COMMISSION_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_BASIS_APPLIED_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  COMMISSION_RATE_APPLIED_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_SCOPE_APPLIED_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_TIER_NAME_APPLIED_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
  OWNER_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  PAYMENT_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'commission',
  namePlural: 'commissions',
  labelSingular: 'Commission',
  labelPlural: 'Commissions',
  description: 'Money an agent earned on a Payment.',
  icon: 'IconCoin',
  disabledObjectPermissionActions: ['canDestroyObjectRecords'],
  isUICreatable: false,
  labelIdentifierFieldMetadataUniversalIdentifier:
    COMMISSION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: COMMISSION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconTag',
    },
    {
      universalIdentifier: COMMISSION_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'amount',
      label: 'Amount',
      description: 'Commission earned, in USD.',
      icon: 'IconCurrencyDollar',
      isNullable: true,
    },
    {
      universalIdentifier: COMMISSION_RATE_APPLIED_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'rateApplied',
      label: 'Rate applied',
      description: 'Copy of the tier rate used, so later edits change nothing.',
      icon: 'IconPercentage',
      isNullable: true,
    },
    {
      universalIdentifier: COMMISSION_TIER_NAME_APPLIED_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'tierName',
      label: 'Tier name',
      description: 'Copy of the tier name used.',
      icon: 'IconTag',
      isNullable: true,
    },
    {
      universalIdentifier: COMMISSION_BASIS_APPLIED_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'basis',
      label: 'Basis',
      description: 'COMMISSION_BASIS in force when earned.',
      icon: 'IconTag',
      isNullable: true,
    },
    {
      universalIdentifier: COMMISSION_SCOPE_APPLIED_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'scope',
      label: 'Scope',
      description: 'COMMISSION_SCOPE in force when earned.',
      icon: 'IconTag',
      isNullable: true,
    },
    {
      universalIdentifier: PAYMENT_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'payment',
      label: 'Payment',
      icon: 'IconCash',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        COMMISSIONS_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'paymentId',
      },
    },
    {
      universalIdentifier: FOLLOWUP_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'followup',
      label: 'Followup',
      icon: 'IconPhoneCall',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        COMMISSIONS_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'followupId',
      },
    },
    {
      universalIdentifier: OWNER_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'owner',
      label: 'Owner',
      icon: 'IconUserCircle',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember
          .universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        COMMISSIONS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'ownerId',
      },
    },
    {
      universalIdentifier: MONTHLY_INCOME_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'monthlyIncome',
      label: 'Monthly Income',
      icon: 'IconCalendarDollar',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        COMMISSIONS_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'monthlyIncomeId',
      },
    },
  ],
});
