import {
  FieldType,
  OnDeleteAction,
  RelationType,
  defineField,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CAMPAIGN_SEGMENT_SEGMENT_FIELD_UNIVERSAL_IDENTIFIER =
  'ea547f8a-a102-4e1d-832d-b104c2e03e54';
export const SEGMENT_CAMPAIGN_SEGMENTS_FIELD_UNIVERSAL_IDENTIFIER =
  '2876dd91-20c9-4e7b-9c62-58079525ec7d';

export default defineField({
  universalIdentifier: CAMPAIGN_SEGMENT_SEGMENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'segment',
  label: 'Segment',
  icon: 'IconFilter',
  relationTargetObjectMetadataUniversalIdentifier:
    SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SEGMENT_CAMPAIGN_SEGMENTS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'segmentId',
  },
});
