import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_LAST_CHALLENGE_FAILED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'a0f3facf-fcb1-4282-9f2a-e5eb9ba26677';

export default defineField({
  universalIdentifier: PERSON_LAST_CHALLENGE_FAILED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'lastChallengeFailedAt',
  label: 'Last challenge failed at',
  icon: 'IconCalendarX',
  isNullable: true,
});
