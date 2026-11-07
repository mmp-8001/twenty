import { defineIndex } from 'twenty-sdk/define';

import {
  COMMISSION_ACCOUNT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_ACCOUNT_KEY_INDEX_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_ACCOUNT_KEY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// One account never pays two Commissions.
export default defineIndex({
  universalIdentifier: COMMISSION_ACCOUNT_KEY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: COMMISSION_ACCOUNT_KEY_INDEX_FIELD_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: COMMISSION_ACCOUNT_KEY_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
