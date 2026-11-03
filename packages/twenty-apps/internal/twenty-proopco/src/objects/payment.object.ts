import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  PAYMENT_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_KIND_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  PAYMENT_PAID_AT_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENTS_ON_TRADING_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  TRADER_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNT_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'payment',
  namePlural: 'payments',
  labelSingular: 'Payment',
  labelPlural: 'Payments',
  description: 'Cash received from a Trader, synced read-only from proopco.',
  icon: 'IconCash',
  disabledObjectPermissionActions: [
    'canUpdateObjectRecords',
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  isUICreatable: false,
  isUIEditable: false,
  labelIdentifierFieldMetadataUniversalIdentifier:
    PAYMENT_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: PAYMENT_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'proopcoId',
      label: 'Proopco ID',
      description: 'Identifier assigned by proopco.',
      icon: 'IconHash',
      isUnique: true,
    },
    {
      universalIdentifier: PAYMENT_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'amount',
      label: 'Amount',
      description: 'Cash received, in USD.',
      icon: 'IconCurrencyDollar',
      isNullable: true,
    },
    {
      universalIdentifier: PAYMENT_KIND_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'kind',
      label: 'Kind',
      description: 'What the payment paid for.',
      icon: 'IconTag',
      isNullable: true,
      options: [
        {
          id: '0d1b7a52-2f10-4a67-9d1f-3b0e5d6f7c11',
          value: 'PURCHASE',
          label: 'Purchase',
          position: 0,
          color: 'green',
        },
        {
          id: '5c2e8f34-9a41-4b7d-8e63-1f4a7b9c2d22',
          value: 'INSTALLMENT_INITIAL',
          label: 'Installment initial',
          position: 1,
          color: 'blue',
        },
        {
          id: 'a93d6c18-7e05-4f2b-b4a9-6d8e0c1f3a33',
          value: 'INSTALLMENT_REMAINING',
          label: 'Installment remaining',
          position: 2,
          color: 'purple',
        },
      ],
    },
    {
      universalIdentifier: PAYMENT_PAID_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'paidAt',
      label: 'Paid at',
      description: 'When proopco received the cash.',
      icon: 'IconCalendarEvent',
      isNullable: true,
    },
    {
      universalIdentifier: TRADER_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'trader',
      label: 'Trader',
      description: 'Trader who paid.',
      icon: 'IconUser',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        PAYMENTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'traderId',
      },
    },
    {
      universalIdentifier:
        TRADING_ACCOUNT_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'tradingAccount',
      label: 'Trading Account',
      description: 'Trading Account this payment bought.',
      icon: 'IconChartCandle',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        TRADING_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        PAYMENTS_ON_TRADING_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'tradingAccountId',
      },
    },
  ],
});
