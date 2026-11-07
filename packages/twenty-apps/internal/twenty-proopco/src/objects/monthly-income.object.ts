import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { INCOME_STATUSES } from 'src/constants/income-report.constant';
import {
  MONTHLY_INCOME_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_JALALI_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_JALALI_YEAR_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_PAID_AT_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_PAID_BY_ID_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_TOTAL_USDT_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOMES_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { buildSelectOptions } from 'src/utils/build-select-options.util';

// Written by the app only: the rollup creates it and "Mark paid" is a Full Admin route with an audit entry.
export default defineObject({
  universalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'monthlyIncome',
  namePlural: 'monthlyIncomes',
  labelSingular: 'Monthly income',
  labelPlural: 'Monthly incomes',
  description: 'One Agent\'s Commissions for one Jalali month.',
  icon: 'IconCoin',
  disabledObjectPermissionActions: [
    'canUpdateObjectRecords',
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  isUICreatable: false,
  isUIEditable: false,
  labelIdentifierFieldMetadataUniversalIdentifier: MONTHLY_INCOME_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: MONTHLY_INCOME_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'incomeKey',
      label: 'Income key',
      description: 'Agent id and Jalali year-month. A unique index allows one income per Agent and month.',
      icon: 'IconKey',
    },
    {
      universalIdentifier: MONTHLY_INCOME_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'admin',
      label: 'Agent',
      icon: 'IconHeadset',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        MONTHLY_INCOMES_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'adminId',
      },
    },
    {
      universalIdentifier: MONTHLY_INCOME_JALALI_YEAR_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'jalaliYear',
      label: 'Jalali year',
      icon: 'IconCalendar',
      isNullable: true,
    },
    {
      universalIdentifier: MONTHLY_INCOME_JALALI_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'jalaliMonth',
      label: 'Jalali month',
      icon: 'IconCalendarMonth',
      isNullable: true,
    },
    {
      universalIdentifier: MONTHLY_INCOME_TOTAL_USDT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'totalUsdt',
      label: 'Total (USDT)',
      icon: 'IconCoin',
      isNullable: true,
    },
    {
      universalIdentifier: MONTHLY_INCOME_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgressCheck',
      defaultValue: "'PENDING'",
      options: buildSelectOptions('monthlyIncome.status', INCOME_STATUSES),
    },
    {
      universalIdentifier: MONTHLY_INCOME_PAID_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'paidAt',
      label: 'Paid at',
      icon: 'IconCalendarCheck',
      isNullable: true,
    },
    {
      universalIdentifier: MONTHLY_INCOME_PAID_BY_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'paidById',
      label: 'Paid by',
      description: 'Workspace member id of the Full Admin.',
      icon: 'IconUser',
      isNullable: true,
    },
  ],
});
