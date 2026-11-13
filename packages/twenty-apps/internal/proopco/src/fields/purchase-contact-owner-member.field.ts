import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export const PURCHASE_CONTACT_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER =
  '95331104-67b2-4ecb-acc5-7d6647729c39';
export const WORKSPACE_MEMBER_CONTACT_OWNED_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER =
  '8b58a9c1-6d99-4b70-aa2d-7eebe8f7f85f';

export default defineField({
  universalIdentifier: PURCHASE_CONTACT_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'contactOwnerMember',
  label: 'Contact owner member',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    WORKSPACE_MEMBER_CONTACT_OWNED_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'contactOwnerMemberId',
  },
});
