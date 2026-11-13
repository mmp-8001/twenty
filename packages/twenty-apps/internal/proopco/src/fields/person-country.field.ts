import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_COUNTRY_FIELD_UNIVERSAL_IDENTIFIER =
  'e7e6397b-5f03-46e7-9ba0-07f35c09165b';

export default defineField({
  universalIdentifier: PERSON_COUNTRY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.TEXT,
  name: 'country',
  label: 'Country',
  icon: 'IconWorld',
  isNullable: true,
});
