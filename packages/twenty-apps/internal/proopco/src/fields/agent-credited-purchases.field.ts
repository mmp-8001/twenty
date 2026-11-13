import {
  defineField,
  FieldType,
  RelationType,
  } from 'twenty-sdk/define';

import { PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER, AGENT_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { AGENT_CREDITED_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER, PURCHASE_CREDITED_AGENT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/purchase-credited-agent.field';

export default defineField({
  universalIdentifier: AGENT_CREDITED_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'creditedPurchases',
  label: 'Credited purchases',
  icon: 'IconCoin',
  relationTargetObjectMetadataUniversalIdentifier:
    PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    PURCHASE_CREDITED_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
