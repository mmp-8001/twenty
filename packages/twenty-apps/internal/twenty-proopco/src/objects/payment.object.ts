import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CHALLENGE_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  CHALLENGE_ACCOUNT_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_AMOUNT_TOMAN_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_AMOUNT_USDT_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  PAYMENT_OFFER_CODE_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_PAID_AT_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENTS_ON_CHALLENGE_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  USER_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'payment',
  namePlural: 'payments',
  labelSingular: 'Payment',
  labelPlural: 'Payments',
  description: 'Cash received from a User, synced read-only from proopco.',
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
      universalIdentifier: PAYMENT_AMOUNT_TOMAN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'amountToman',
      label: 'Amount (Toman)',
      description: 'Amount settled, in Toman. Converted by proopco.',
      icon: 'IconCash',
      isNullable: true,
    },
    {
      universalIdentifier: PAYMENT_AMOUNT_USDT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'amountUsdt',
      label: 'Amount (USDT)',
      description: 'Amount settled, in USDT. Converted by proopco.',
      icon: 'IconCurrencyDollar',
      isNullable: true,
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
      universalIdentifier: PAYMENT_OFFER_CODE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'offerCode',
      label: 'Offer code used',
      description: 'The CRM-activated code this purchase used, as proopco reports it.',
      icon: 'IconTicket',
      isNullable: true,
    },
    {
      universalIdentifier: USER_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'person',
      label: 'User',
      description: 'User who paid.',
      icon: 'IconUser',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        PAYMENTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'personId',
      },
    },
    {
      universalIdentifier:
        CHALLENGE_ACCOUNT_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'challengeAccount',
      label: 'Challenge Account',
      description: 'Challenge Account this payment bought.',
      icon: 'IconChartCandle',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        CHALLENGE_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        PAYMENTS_ON_CHALLENGE_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'challengeAccountId',
      },
    },
  ],
});
