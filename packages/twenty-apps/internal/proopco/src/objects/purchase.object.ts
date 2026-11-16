import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  PURCHASE_AMOUNT_USDT_FIELD_UNIVERSAL_IDENTIFIER,
  PURCHASE_CODE_TEXT_FIELD_UNIVERSAL_IDENTIFIER,
  PURCHASE_COMMISSION_USDT_FIELD_UNIVERSAL_IDENTIFIER,
  PURCHASE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  PURCHASE_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  PURCHASE_PLATFORM_PURCHASE_ID_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'purchase',
  namePlural: 'purchases',
  labelSingular: 'Purchase',
  labelPlural: 'Purchases',
  description: 'A settled platform purchase, attributed to an agent or left unattributed',
  icon: 'IconCoin',
  labelIdentifierFieldMetadataUniversalIdentifier:
    PURCHASE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: PURCHASE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
      defaultValue: "''",
    },
    {
      universalIdentifier: PURCHASE_PLATFORM_PURCHASE_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'platformPurchaseId',
      label: 'Platform purchase ID',
      icon: 'IconId',
      isUnique: true,
    },
    {
      universalIdentifier: PURCHASE_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'occurredAt',
      label: 'Occurred at',
      icon: 'IconCalendarEvent',
      isNullable: true,
    },
    {
      universalIdentifier: PURCHASE_AMOUNT_USDT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'amountUsdt',
      label: 'Amount (USDT)',
      icon: 'IconCoin',
      isNullable: true,
      universalSettings: { decimals: 2 },
    },
    {
      universalIdentifier: PURCHASE_CODE_TEXT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'codeText',
      label: 'Code used',
      icon: 'IconTicket',
      isNullable: true,
    },
    {
      universalIdentifier: PURCHASE_COMMISSION_USDT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'commissionUsdt',
      label: 'Commission (USDT)',
      icon: 'IconPercentage',
      isNullable: true,
      universalSettings: { decimals: 2 },
    },
  ],
});
