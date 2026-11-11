import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_CONTACT_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER =
  'e5176616-d0d1-4f0d-853c-1769fb3ce6ae';
export const WORKSPACE_MEMBER_CONTACT_OWNED_DEALS_FIELD_UNIVERSAL_IDENTIFIER =
  'be9cfe4e-8cad-455f-ae87-3180af2e588b';

export default defineField({
  universalIdentifier: OPPORTUNITY_CONTACT_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.RELATION,
  name: 'contactOwnerMember',
  label: 'Contact owner member',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    WORKSPACE_MEMBER_CONTACT_OWNED_DEALS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'contactOwnerMemberId',
  },
});
