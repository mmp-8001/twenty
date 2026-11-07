import { defineField, FieldType } from 'twenty-sdk/define';

import {
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_TRANSFERRED_FROM_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: FOLLOWUP_TRANSFERRED_FROM_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.TEXT,
  name: 'transferredFrom',
  label: 'Transferred from',
  description: 'The Followup this case continues after a transfer.',
  icon: 'IconArrowsExchange',
  isNullable: true,
  isUIEditable: false,
});
