import { defineIndex } from 'twenty-sdk/define';

import {
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OPEN_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OPEN_KEY_INDEX_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OPEN_KEY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Empty keys never collide, so only open records are constrained.
export default defineIndex({
  universalIdentifier: FOLLOWUP_OPEN_KEY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: FOLLOWUP_OPEN_KEY_INDEX_FIELD_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: FOLLOWUP_OPEN_KEY_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
