import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  PURCHASE_CODE_FIELD_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_PURCHASE_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/purchase-code.field';

export default defineField({
  universalIdentifier: DISCOUNT_CODE_PURCHASE_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'purchases',
  label: 'Purchases',
  icon: 'IconTicket',
  relationTargetObjectMetadataUniversalIdentifier:
    PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    PURCHASE_CODE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
