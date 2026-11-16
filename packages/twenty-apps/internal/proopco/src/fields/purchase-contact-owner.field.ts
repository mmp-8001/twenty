import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER, AGENT_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export const PURCHASE_CONTACT_OWNER_FIELD_UNIVERSAL_IDENTIFIER =
  '35fdf085-cd8a-4c2b-b582-1442b2cd3d29';
export const AGENT_CONTACT_OWNED_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER =
  '2d709cbd-c613-4686-8e6b-7fda9723f8d5';

export default defineField({
  universalIdentifier: PURCHASE_CONTACT_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'contactOwner',
  label: 'Contact owner',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AGENT_CONTACT_OWNED_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'contactOwnerId',
  },
});
