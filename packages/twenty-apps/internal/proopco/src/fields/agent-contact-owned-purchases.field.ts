import {
  defineField,
  FieldType,
  RelationType,
  } from 'twenty-sdk/define';

import { PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER, AGENT_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { AGENT_CONTACT_OWNED_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER, PURCHASE_CONTACT_OWNER_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/purchase-contact-owner.field';

export default defineField({
  universalIdentifier: AGENT_CONTACT_OWNED_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'contactOwnedPurchases',
  label: 'Contact-owned purchases',
  icon: 'IconCoin',
  relationTargetObjectMetadataUniversalIdentifier:
    PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    PURCHASE_CONTACT_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
