import { defineIndex } from 'twenty-sdk/define';

import {
  AGENT_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_AGENT_MONTH_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineIndex({
  universalIdentifier:
    MONTHLY_INCOME_AGENT_MONTH_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: '8c9d0e1f-2a3b-4c4d-9e5f-7a8b9c0d1e07',
      fieldUniversalIdentifier: AGENT_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
    },
    {
      universalIdentifier: '9d0e1f2a-3b4c-4d5e-8f6a-8b9c0d1e2f08',
      fieldUniversalIdentifier: MONTHLY_INCOME_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
