import { defineIndex } from 'twenty-sdk/define';

import {
  COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  COMMISSION_PAYMENT_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  PAYMENT_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: COMMISSION_PAYMENT_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: '7b8c9d0e-1f2a-4b3c-8d4e-6f7a8b9c0d06',
      fieldUniversalIdentifier: PAYMENT_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
