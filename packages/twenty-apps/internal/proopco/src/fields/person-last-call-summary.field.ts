import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_LAST_CALL_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER =
  '957afa28-ed57-4979-8f38-53e51fcbd39b';

export default defineField({
  universalIdentifier: PERSON_LAST_CALL_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.TEXT,
  name: 'lastCallSummary',
  label: 'Last call summary',
  icon: 'IconNotes',
  isNullable: true,
});
