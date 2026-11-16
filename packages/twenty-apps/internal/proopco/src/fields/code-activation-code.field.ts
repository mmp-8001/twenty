import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CODE_ACTIVATION_CODE_FIELD_UNIVERSAL_IDENTIFIER =
  '51945c76-83bf-4186-98b9-f24e38de6e0f';
export const DISCOUNT_CODE_CODE_ACTIVATION_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER =
  '051a4db3-0183-4d9d-82e0-7f81c62ad3b8';

export default defineField({
  universalIdentifier: CODE_ACTIVATION_CODE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'code',
  label: 'Code',
  icon: 'IconTicket',
  relationTargetObjectMetadataUniversalIdentifier:
    DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    DISCOUNT_CODE_CODE_ACTIVATION_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'codeId',
  },
});
