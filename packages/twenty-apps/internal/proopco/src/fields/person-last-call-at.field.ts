import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_LAST_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'df11d7c4-a87a-46be-90e2-c6d6edfe6402';

export default defineField({
  universalIdentifier: PERSON_LAST_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'lastCallAt',
  label: 'Last call at',
  icon: 'IconCalendarEvent',
  isNullable: true,
});
