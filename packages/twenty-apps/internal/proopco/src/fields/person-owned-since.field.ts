import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_OWNED_SINCE_FIELD_UNIVERSAL_IDENTIFIER =
  '2fb5abc8-e87f-4e01-bb30-3ddbe7063e40';

export default defineField({
  universalIdentifier: PERSON_OWNED_SINCE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'ownedSince',
  label: 'Owned since',
  icon: 'IconUserCheck',
  isNullable: true,
});
