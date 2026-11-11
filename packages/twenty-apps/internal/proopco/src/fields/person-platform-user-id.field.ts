import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_PLATFORM_USER_ID_FIELD_UNIVERSAL_IDENTIFIER =
  '9859985c-4aaa-432b-8d1a-7471e39f419d';

export default defineField({
  universalIdentifier: PERSON_PLATFORM_USER_ID_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.TEXT,
  name: 'platformUserId',
  label: 'Platform user ID',
  icon: 'IconId',
  isNullable: true,
  isUnique: true,
});
