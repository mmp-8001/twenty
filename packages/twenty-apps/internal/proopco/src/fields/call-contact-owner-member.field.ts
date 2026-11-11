import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CALL_CONTACT_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER =
  '0bf3aedb-3ff2-4e02-bb3c-e8ec7a466475';
export const WORKSPACE_MEMBER_CONTACT_OWNED_CALLS_FIELD_UNIVERSAL_IDENTIFIER =
  'b3953f0d-cf96-4f00-a310-67f54f3fcf32';

export default defineField({
  universalIdentifier: CALL_CONTACT_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'contactOwnerMember',
  label: 'Contact owner member',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    WORKSPACE_MEMBER_CONTACT_OWNED_CALLS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'contactOwnerMemberId',
  },
});
