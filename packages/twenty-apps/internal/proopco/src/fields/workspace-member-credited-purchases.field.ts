import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { WORKSPACE_MEMBER_CREDITED_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER, PURCHASE_CREDITED_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/purchase-credited-agent-member.field';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_CREDITED_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'creditedPurchases',
  label: 'Credited purchases',
  icon: 'IconCoin',
  relationTargetObjectMetadataUniversalIdentifier:
    PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    PURCHASE_CREDITED_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
