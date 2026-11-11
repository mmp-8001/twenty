import { defineView, ViewType } from 'twenty-sdk/define';

import {
  SEGMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  SEGMENTS_VIEW_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  SEGMENTS_VIEW_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
  SEGMENTS_VIEW_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  SEGMENTS_VIEW_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
  SEGMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  SEGMENT_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
  SEGMENT_VIEW_ID_FIELD_UNIVERSAL_IDENTIFIER,
  SEGMENT_VALIDATION_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const column = (
  universalIdentifier: string,
  fieldMetadataUniversalIdentifier: string,
  position: number,
) => ({
  universalIdentifier,
  fieldMetadataUniversalIdentifier,
  position,
  isVisible: true,
  size: 180,
});

export default defineView({
  universalIdentifier: SEGMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Segments',
  objectUniversalIdentifier: SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconFilter',
  position: 2,
  fields: [
    column(
      SEGMENTS_VIEW_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      SEGMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      0,
    ),
    column(
      SEGMENTS_VIEW_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
      SEGMENT_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
      1,
    ),
    column(
      SEGMENTS_VIEW_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      SEGMENT_VIEW_ID_FIELD_UNIVERSAL_IDENTIFIER,
      2,
    ),
    column(
      SEGMENTS_VIEW_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
      SEGMENT_VALIDATION_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
      3,
    ),
  ],
});
