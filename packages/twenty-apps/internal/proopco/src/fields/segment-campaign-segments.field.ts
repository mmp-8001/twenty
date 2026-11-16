import { FieldType, RelationType, defineField } from 'twenty-sdk/define';

import {
  CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  CAMPAIGN_SEGMENT_SEGMENT_FIELD_UNIVERSAL_IDENTIFIER,
  SEGMENT_CAMPAIGN_SEGMENTS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/campaign-segment-segment.field';

export default defineField({
  universalIdentifier: SEGMENT_CAMPAIGN_SEGMENTS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'campaignSegments',
  label: 'Campaigns',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier:
    CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CAMPAIGN_SEGMENT_SEGMENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
