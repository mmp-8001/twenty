import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_SEGMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'campaignSegment',
  namePlural: 'campaignSegments',
  labelSingular: 'Campaign segment',
  labelPlural: 'Campaign segments',
  description: 'Links a segment to a campaign',
  icon: 'IconFilter',
  labelIdentifierFieldMetadataUniversalIdentifier:
    CAMPAIGN_SEGMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: CAMPAIGN_SEGMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
      defaultValue: "''",
    },
  ],
});
