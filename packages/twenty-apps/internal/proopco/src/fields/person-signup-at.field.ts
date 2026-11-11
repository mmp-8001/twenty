import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_SIGNUP_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '20cef393-83f3-4d93-b194-c4701c9175bc';

export default defineField({
  universalIdentifier: PERSON_SIGNUP_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'signupAt',
  label: 'Signed up at',
  icon: 'IconCalendarPlus',
  isNullable: true,
});
