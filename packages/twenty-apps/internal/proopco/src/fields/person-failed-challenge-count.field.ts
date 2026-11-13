import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_FAILED_CHALLENGE_COUNT_FIELD_UNIVERSAL_IDENTIFIER =
  '6eb7b0c7-bf5c-48de-ab85-3a98f6ced230';

export default defineField({
  universalIdentifier: PERSON_FAILED_CHALLENGE_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.NUMBER,
  name: 'failedChallengeCount',
  label: 'Failed challenges',
  icon: 'IconX',
  isNullable: true,
});
