import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export const PURCHASE_CONTACT_FIELD_UNIVERSAL_IDENTIFIER =
  'b59df999-fde0-4c23-ae1c-a965cbd00bbf';
export const PERSON_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER =
  'f3df627d-1cf5-4065-8e67-d0299264b9cf';

export default defineField({
  universalIdentifier: PURCHASE_CONTACT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'contact',
  label: 'Contact',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    PERSON_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'contactId',
  },
});
