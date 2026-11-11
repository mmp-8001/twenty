import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { OPPORTUNITY_SOURCE_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER, CAMPAIGN_DEALS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-source-campaign.field';

export default defineField({
  universalIdentifier: CAMPAIGN_DEALS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'deals',
  label: 'Deals',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    OPPORTUNITY_SOURCE_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
