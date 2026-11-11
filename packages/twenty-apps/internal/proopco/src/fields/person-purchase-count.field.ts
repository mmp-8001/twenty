import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_PURCHASE_COUNT_FIELD_UNIVERSAL_IDENTIFIER =
  'bec3f418-2bbf-45d0-ae31-bab7e077d42e';

export default defineField({
  universalIdentifier: PERSON_PURCHASE_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.NUMBER,
  name: 'purchaseCount',
  label: 'Purchases',
  icon: 'IconShoppingCart',
  isNullable: true,
});
