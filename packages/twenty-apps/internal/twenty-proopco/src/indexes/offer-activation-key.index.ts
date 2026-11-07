import { defineIndex } from 'twenty-sdk/define';

import {
  OFFER_ACTIVATION_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_ACTIVATION_KEY_INDEX_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_ACTIVATION_KEY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  OFFER_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// CODE-06 / invariant 8: one Offer is never activated twice for one User.
export default defineIndex({
  universalIdentifier: OFFER_ACTIVATION_KEY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: OFFER_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: OFFER_ACTIVATION_KEY_INDEX_FIELD_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: OFFER_ACTIVATION_KEY_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
