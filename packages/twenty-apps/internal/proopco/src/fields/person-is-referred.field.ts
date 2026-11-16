import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_IS_REFERRED_FIELD_UNIVERSAL_IDENTIFIER =
  '4353ee94-caad-47d0-9aec-39f6ad7134ea';

export default defineField({
  universalIdentifier: PERSON_IS_REFERRED_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.BOOLEAN,
  name: 'isReferred',
  label: 'Is referred',
  icon: 'IconUserPlus',
  isNullable: true,
});
