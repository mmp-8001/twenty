import { defineIndex } from 'twenty-sdk/define';

import {
  MONTHLY_INCOME_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_KEY_INDEX_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_KEY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// An Admin has one income per Jalali month, even if two rollups race.
export default defineIndex({
  universalIdentifier: MONTHLY_INCOME_KEY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: MONTHLY_INCOME_KEY_INDEX_FIELD_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: MONTHLY_INCOME_KEY_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
