import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_PLATFORM_UPDATED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '4b0b87dc-3ac6-47d4-9107-e38203291fb5';

export default defineField({
  universalIdentifier: PERSON_PLATFORM_UPDATED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'platformUpdatedAt',
  label: 'Platform updated at',
  icon: 'IconClockEdit',
  isNullable: true,
});
