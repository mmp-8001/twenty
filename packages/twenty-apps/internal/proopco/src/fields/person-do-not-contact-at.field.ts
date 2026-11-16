import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_DO_NOT_CONTACT_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '2a176e8b-ee1d-4030-82e4-faa33e517174';

export default defineField({
  universalIdentifier: PERSON_DO_NOT_CONTACT_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'doNotContactAt',
  label: 'Do not contact at',
  icon: 'IconBan',
  isNullable: true,
});
