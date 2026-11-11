import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { MONTHLY_INCOME_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER, PURCHASE_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/purchase-monthly-income.field';

export default defineField({
  universalIdentifier: MONTHLY_INCOME_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'purchases',
  label: 'Purchases',
  icon: 'IconCoin',
  relationTargetObjectMetadataUniversalIdentifier: PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: PURCHASE_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
