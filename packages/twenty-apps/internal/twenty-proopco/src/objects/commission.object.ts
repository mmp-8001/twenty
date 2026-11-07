import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CHALLENGE_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  COMMISSION_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_ACCOUNT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_AMOUNT_USDT_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_COMMISSION_USDT_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_FOLLOWUP_ID_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_KIND_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  COMMISSION_OWNERSHIP_ID_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_PURCHASED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_RATE_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_ON_CHALLENGE_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { COMMISSION_KINDS } from 'src/constants/ownership.constant';
import { buildSelectOptions } from 'src/utils/build-select-options.util';

const manyToOne = (joinColumnName: string) => ({
  relationType: RelationType.MANY_TO_ONE,
  onDelete: OnDeleteAction.SET_NULL,
  joinColumnName,
});

// Written by the app only: no role updates or deletes a Commission.
export default defineObject({
  universalIdentifier: COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'commission',
  namePlural: 'commissions',
  labelSingular: 'Commission',
  labelPlural: 'Commissions',
  description: 'The 2% an Admin earns on one purchased Challenge Account.',
  icon: 'IconCoin',
  disabledObjectPermissionActions: [
    'canUpdateObjectRecords',
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  isUICreatable: false,
  isUIEditable: false,
  labelIdentifierFieldMetadataUniversalIdentifier:
    COMMISSION_ACCOUNT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: COMMISSION_ACCOUNT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'accountKey',
      label: 'Account key',
      description: 'The Challenge Account id. A unique index allows one Commission per account.',
      icon: 'IconKey',
    },
    {
      universalIdentifier: COMMISSION_KIND_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'kind',
      label: 'Kind',
      icon: 'IconCategory',
      defaultValue: "'CAMPAIGN_SUCCESS'",
      options: buildSelectOptions('commission.kind', COMMISSION_KINDS),
    },
    {
      universalIdentifier: COMMISSION_AMOUNT_USDT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'amountUsdt',
      label: 'Amount (USDT)',
      description: 'The paid amount the rate applies to.',
      icon: 'IconCurrencyDollar',
      isNullable: true,
    },
    {
      universalIdentifier: COMMISSION_RATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'rate',
      label: 'Rate (%)',
      description: 'Stored per Commission so a future rate change leaves history intact.',
      icon: 'IconPercentage',
      isNullable: true,
    },
    {
      universalIdentifier: COMMISSION_COMMISSION_USDT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'commissionUsdt',
      label: 'Commission (USDT)',
      icon: 'IconCoin',
      isNullable: true,
    },
    {
      universalIdentifier: COMMISSION_PURCHASED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'purchasedAt',
      label: 'Purchased at',
      icon: 'IconCalendarEvent',
      isNullable: true,
    },
    {
      universalIdentifier: COMMISSION_OWNERSHIP_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'ownershipId',
      label: 'Ownership id',
      icon: 'IconUserCheck',
      isNullable: true,
    },
    {
      universalIdentifier: COMMISSION_FOLLOWUP_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'followupId',
      label: 'Followup id',
      description: 'Empty for a retention Commission.',
      icon: 'IconPhoneCheck',
      isNullable: true,
    },
    {
      universalIdentifier: COMMISSION_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'person',
      label: 'User',
      icon: 'IconUser',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        COMMISSIONS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: manyToOne('personId'),
    },
    {
      universalIdentifier: COMMISSION_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'admin',
      label: 'Admin',
      icon: 'IconHeadset',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        COMMISSIONS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: manyToOne('adminId'),
    },
    {
      universalIdentifier: COMMISSION_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'challengeAccount',
      label: 'Challenge Account',
      icon: 'IconChartCandle',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        CHALLENGE_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        COMMISSIONS_ON_CHALLENGE_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: manyToOne('challengeAccountId'),
    },
    {
      universalIdentifier: COMMISSION_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'payment',
      label: 'Payment',
      icon: 'IconCash',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        COMMISSIONS_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: manyToOne('paymentId'),
    },
  ],
});
