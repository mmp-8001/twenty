import {
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

import {
  PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  WORKSPACE_MEMBER_OWNED_CONTACTS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/person-owner-member.field';

export default defineField({
  universalIdentifier:
    WORKSPACE_MEMBER_OWNED_CONTACTS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'ownedContacts',
  label: 'Owned contacts',
  icon: 'IconUsers',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
