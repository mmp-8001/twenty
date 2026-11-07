import { defineIndex } from 'twenty-sdk/define';

import {
  OWNERSHIP_OBJECT_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_OPEN_USER_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_OPEN_USER_KEY_INDEX_FIELD_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_OPEN_USER_KEY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Empty keys never collide, so only open records are constrained.
export default defineIndex({
  universalIdentifier: OWNERSHIP_OPEN_USER_KEY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: OWNERSHIP_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: OWNERSHIP_OPEN_USER_KEY_INDEX_FIELD_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: OWNERSHIP_OPEN_USER_KEY_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
