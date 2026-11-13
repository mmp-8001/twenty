import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_HAS_PHONE_FIELD_UNIVERSAL_IDENTIFIER =
  'f2a3cf2c-9b8d-4be8-bd62-8eceaed25613';

export default defineField({
  universalIdentifier: PERSON_HAS_PHONE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.BOOLEAN,
  name: 'hasPhone',
  label: 'Has phone',
  icon: 'IconPhoneCheck',
  isNullable: true,
});
