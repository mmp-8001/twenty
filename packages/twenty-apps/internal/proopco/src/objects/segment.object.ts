import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  SEGMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  SEGMENT_VIEW_ID_FIELD_UNIVERSAL_IDENTIFIER,
  SEGMENT_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
  SEGMENT_VALIDATION_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'segment',
  namePlural: 'segments',
  labelSingular: 'Segment',
  labelPlural: 'Segments',
  description: 'A saved Person view that selects contacts for campaigns',
  icon: 'IconFilter',
  labelIdentifierFieldMetadataUniversalIdentifier:
    SEGMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: SEGMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
      defaultValue: "''",
    },
    {
      universalIdentifier: SEGMENT_VIEW_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'viewId',
      label: 'View ID',
      icon: 'IconId',
      isNullable: true,
    },
    {
      universalIdentifier: SEGMENT_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.BOOLEAN,
      name: 'isActive',
      label: 'Is active',
      icon: 'IconCheck',
      defaultValue: true,
    },
    {
      universalIdentifier: SEGMENT_VALIDATION_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'validationError',
      label: 'Validation error',
      icon: 'IconAlertTriangle',
      isNullable: true,
    },
  ],
});
