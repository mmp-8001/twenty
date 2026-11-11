import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { OPPORTUNITY_CONTACT_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER, WORKSPACE_MEMBER_CONTACT_OWNED_DEALS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-contact-owner-member.field';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_CONTACT_OWNED_DEALS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'contactOwnedDeals',
  label: 'Contact-owned deals',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    OPPORTUNITY_CONTACT_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
