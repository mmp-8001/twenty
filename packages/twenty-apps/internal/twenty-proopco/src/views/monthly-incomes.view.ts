import { defineView, ViewType } from 'twenty-sdk/define';

import {
  AGENT_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOMES_VIEW_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_PAYOUT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_TOTAL_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: MONTHLY_INCOMES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Monthly Incomes',
  objectUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconCalendarDollar',
  position: 0,
  fields: [
    {
      universalIdentifier: '7b9a2f78-3686-4149-abb7-fa1017bf55f9',
      fieldMetadataUniversalIdentifier:
        MONTHLY_INCOME_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '6a4486fc-1ca7-4ddc-8955-0d1908452a3e',
      fieldMetadataUniversalIdentifier:
        MONTHLY_INCOME_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '98a140ac-eb5a-4c9c-8f80-5476931d7739',
      fieldMetadataUniversalIdentifier:
        MONTHLY_INCOME_TOTAL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'd41eaf0d-9629-4783-8995-412f3e7a4d2b',
      fieldMetadataUniversalIdentifier:
        MONTHLY_INCOME_PAYOUT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '831ebc1f-6682-4968-a697-7f798a1f932c',
      fieldMetadataUniversalIdentifier:
        AGENT_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 160,
    },
  ],
});
