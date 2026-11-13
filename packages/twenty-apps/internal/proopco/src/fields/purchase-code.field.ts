import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const PURCHASE_CODE_FIELD_UNIVERSAL_IDENTIFIER =
  'd4ccbfcd-a0ee-4398-8a16-a5fe52801b07';
export const DISCOUNT_CODE_PURCHASE_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER =
  'a0c2d34f-ea18-4793-a59a-0c0285b2aa1b';

export default defineField({
  universalIdentifier: PURCHASE_CODE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'code',
  label: 'Code',
  icon: 'IconTicket',
  relationTargetObjectMetadataUniversalIdentifier:
    DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    DISCOUNT_CODE_PURCHASE_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'codeId',
  },
});
