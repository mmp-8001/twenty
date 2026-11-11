import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CODE_ACTIVATION_CONTACT_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER =
  '848d7be3-574a-435a-a2d1-6b2855f37eea';
export const WORKSPACE_MEMBER_CODE_ACTIVATION_CONTACT_OWNED_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER =
  'e6295b1c-129d-4dc8-99a1-88c63421e2a0';

export default defineField({
  universalIdentifier: CODE_ACTIVATION_CONTACT_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'contactOwnerMember',
  label: 'Contact owner member',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    WORKSPACE_MEMBER_CODE_ACTIVATION_CONTACT_OWNED_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'contactOwnerMemberId',
  },
});
