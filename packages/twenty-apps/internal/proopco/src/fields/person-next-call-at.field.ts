import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_NEXT_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '9e7c69e7-3733-4105-a253-16fad4ea5934';

export default defineField({
  universalIdentifier: PERSON_NEXT_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'nextCallAt',
  label: 'Next call at',
  icon: 'IconCalendarEvent',
  isNullable: true,
});
