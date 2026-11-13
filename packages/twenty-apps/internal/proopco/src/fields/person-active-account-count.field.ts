import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_ACTIVE_ACCOUNT_COUNT_FIELD_UNIVERSAL_IDENTIFIER =
  '9c84fac3-119a-4693-adcb-aa4b92b9175f';

export default defineField({
  universalIdentifier: PERSON_ACTIVE_ACCOUNT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.NUMBER,
  name: 'activeAccountCount',
  label: 'Active accounts',
  icon: 'IconUsers',
  isNullable: true,
});
