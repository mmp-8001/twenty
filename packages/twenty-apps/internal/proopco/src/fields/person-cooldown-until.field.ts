import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_COOLDOWN_UNTIL_FIELD_UNIVERSAL_IDENTIFIER =
  '3c692067-9722-48f5-8381-a9376d532962';

export default defineField({
  universalIdentifier: PERSON_COOLDOWN_UNTIL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'cooldownUntil',
  label: 'Cool-down until',
  icon: 'IconSnowflake',
  isNullable: true,
});
