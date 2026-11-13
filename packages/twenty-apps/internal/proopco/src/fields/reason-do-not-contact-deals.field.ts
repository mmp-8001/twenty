import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  REASON_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { OPPORTUNITY_DO_NOT_CONTACT_REASON_FIELD_UNIVERSAL_IDENTIFIER, REASON_DO_NOT_CONTACT_DEALS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-do-not-contact-reason.field';

export default defineField({
  universalIdentifier: REASON_DO_NOT_CONTACT_DEALS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'doNotContactDeals',
  label: 'Do not contact deals',
  icon: 'IconBan',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    OPPORTUNITY_DO_NOT_CONTACT_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
