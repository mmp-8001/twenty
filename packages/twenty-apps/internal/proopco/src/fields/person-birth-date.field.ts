import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_BIRTH_DATE_FIELD_UNIVERSAL_IDENTIFIER =
  '400d9b89-f88c-49ff-b09b-35492b64c865';

export default defineField({
  universalIdentifier: PERSON_BIRTH_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE,
  name: 'birthDate',
  label: 'Birth date',
  icon: 'IconCake',
  isNullable: true,
});
