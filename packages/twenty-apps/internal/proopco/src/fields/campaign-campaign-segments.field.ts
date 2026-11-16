import { FieldType, RelationType, defineField } from 'twenty-sdk/define';

import {
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  CAMPAIGN_SEGMENT_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_CAMPAIGN_SEGMENTS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/campaign-segment-campaign.field';

export default defineField({
  universalIdentifier: CAMPAIGN_CAMPAIGN_SEGMENTS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'campaignSegments',
  label: 'Segments',
  icon: 'IconFilter',
  relationTargetObjectMetadataUniversalIdentifier:
    CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CAMPAIGN_SEGMENT_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
