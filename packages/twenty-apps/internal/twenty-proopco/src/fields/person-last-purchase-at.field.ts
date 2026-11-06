import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PERSON_LAST_PURCHASE_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: PERSON_LAST_PURCHASE_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'lastPurchaseAt',
  label: 'Last purchase date',
  description: 'When the User last paid, synced from proopco.',
  icon: 'IconCalendarEvent',
  isNullable: true,
  isUIEditable: false,
});
