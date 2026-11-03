import { defineIndex } from 'twenty-sdk/define';

import {
  FOLLOWUP_ACTIVE_TRADER_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_ACTIVE_TRADER_KEY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Empty keys never collide, so only active Followups are constrained.
export default defineIndex({
  universalIdentifier:
    FOLLOWUP_ACTIVE_TRADER_KEY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: '22537c4a-a540-47ba-a0e1-6f0dfb791374',
      fieldUniversalIdentifier:
        FOLLOWUP_ACTIVE_TRADER_KEY_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
