import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_ELIGIBLE_MEMBER_IDS_FIELD_UNIVERSAL_IDENTIFIER =
  '77daf41f-50f5-437c-8446-a9cfc4569257';

export default defineField({
  universalIdentifier: PERSON_ELIGIBLE_MEMBER_IDS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.ARRAY,
  name: 'eligibleMemberIds',
  label: 'Eligible member IDs',
  description: 'Members who may claim this contact. Written by the app.',
  icon: 'IconUsersGroup',
  isNullable: true,
});
