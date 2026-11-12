import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  MONTHLY_INCOME_JALALI_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_PAID_AT_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_TOTAL_USDT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'monthlyIncome',
  namePlural: 'monthlyIncomes',
  labelSingular: 'Monthly income',
  labelPlural: 'Monthly incomes',
  description: 'What one agent is owed for one Jalali month, from the commission of their credited purchases',
  icon: 'IconCoin',
  labelIdentifierFieldMetadataUniversalIdentifier: MONTHLY_INCOME_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: MONTHLY_INCOME_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
      defaultValue: "''",
    },
    {
      universalIdentifier: MONTHLY_INCOME_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'incomeKey',
      label: 'Income key',
      description: 'Agent and month; keeps one record per agent per month',
      icon: 'IconKey',
      isUnique: true,
      isNullable: true,
    },
    {
      universalIdentifier: MONTHLY_INCOME_JALALI_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'jalaliMonth',
      label: 'Jalali month',
      icon: 'IconCalendarMonth',
      defaultValue: "''",
    },
    {
      universalIdentifier: MONTHLY_INCOME_TOTAL_USDT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'totalUsdt',
      label: 'Total (USDT)',
      icon: 'IconCoin',
      isNullable: true,
      universalSettings: { decimals: 2 },
    },
    {
      universalIdentifier: MONTHLY_INCOME_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgressCheck',
      defaultValue: "'AWAITING_PAYMENT'",
      options: [
        { id: 'f2c2e2f6-6d3b-4b6a-9c5e-0b8f5a1d7c11', value: 'AWAITING_PAYMENT', label: 'در انتظار پرداخت', position: 0, color: 'orange' },
        { id: '3a8c1d52-9f0e-4c8b-a1d4-6e2b7f93c5a2', value: 'PAID', label: 'پرداخت‌شده', position: 1, color: 'green' },
      ],
    },
    {
      universalIdentifier: MONTHLY_INCOME_PAID_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'paidAt',
      label: 'Paid at',
      icon: 'IconCalendarCheck',
      isNullable: true,
    },
  ],
});
