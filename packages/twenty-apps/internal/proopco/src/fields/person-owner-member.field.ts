import {
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

export const PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER =
  'bb849ddb-2313-4591-af33-2e12b9932a2e';
export const WORKSPACE_MEMBER_OWNED_CONTACTS_FIELD_UNIVERSAL_IDENTIFIER =
  '7995177f-2c2a-4e38-be1d-095e6c0363d1';

export default defineField({
  universalIdentifier: PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'ownerMember',
  label: 'Owner member',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    WORKSPACE_MEMBER_OWNED_CONTACTS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'ownerMemberId',
  },
});
