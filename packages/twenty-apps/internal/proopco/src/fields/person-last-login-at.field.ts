import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_LAST_LOGIN_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '4be50cbb-75f1-42b9-8bdf-b27ac98f2024';

export default defineField({
  universalIdentifier: PERSON_LAST_LOGIN_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'lastLoginAt',
  label: 'Last login at',
  icon: 'IconLogin',
  isNullable: true,
});
