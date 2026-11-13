import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { OPPORTUNITY_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER, PURCHASE_DEAL_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/purchase-deal.field';

export default defineField({
  universalIdentifier: OPPORTUNITY_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.RELATION,
  name: 'purchases',
  label: 'Purchases',
  icon: 'IconCoin',
  relationTargetObjectMetadataUniversalIdentifier:
    PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    PURCHASE_DEAL_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
