import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_DEADLINE_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'd342e9b3-68e7-4212-9753-baecfa91fc06';

export default defineField({
  universalIdentifier: PERSON_DEADLINE_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'deadlineAt',
  label: 'Deadline at',
  icon: 'IconClock',
  isNullable: true,
});
