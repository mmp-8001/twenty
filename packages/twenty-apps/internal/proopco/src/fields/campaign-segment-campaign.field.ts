import {
  FieldType,
  OnDeleteAction,
  RelationType,
  defineField,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CAMPAIGN_SEGMENT_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER =
  'c1c9e751-6cfa-409b-b00c-93723760786b';
export const CAMPAIGN_CAMPAIGN_SEGMENTS_FIELD_UNIVERSAL_IDENTIFIER =
  '40a6fbce-bc91-4b3f-b776-aa917b194da6';

export default defineField({
  universalIdentifier: CAMPAIGN_SEGMENT_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'campaign',
  label: 'Campaign',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier:
    CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CAMPAIGN_CAMPAIGN_SEGMENTS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'campaignId',
  },
});
