import { defineView, ViewType } from 'twenty-sdk/define';

import {
  MONTHLY_INCOMES_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOMES_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOMES_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOMES_VIEW_FIELD_4_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOMES_VIEW_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_JALALI_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_JALALI_YEAR_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_TOTAL_USDT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: MONTHLY_INCOMES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Monthly incomes',
  objectUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconCoin',
  position: 3,
  fields: [
    {
      universalIdentifier: MONTHLY_INCOMES_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: MONTHLY_INCOME_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: MONTHLY_INCOMES_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: MONTHLY_INCOME_JALALI_YEAR_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: MONTHLY_INCOMES_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: MONTHLY_INCOME_JALALI_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: MONTHLY_INCOMES_VIEW_FIELD_4_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: MONTHLY_INCOME_TOTAL_USDT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 140,
    },
  ],
});
