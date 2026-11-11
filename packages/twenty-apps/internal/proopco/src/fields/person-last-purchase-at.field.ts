import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_LAST_PURCHASE_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '89f9b511-92d9-4892-a53e-2159a51ba58b';

export default defineField({
  universalIdentifier: PERSON_LAST_PURCHASE_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'lastPurchaseAt',
  label: 'Last purchase at',
  icon: 'IconCalendarDollar',
  isNullable: true,
});
