import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CALL_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  REASON_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CALL_REASON_REASON_FIELD_UNIVERSAL_IDENTIFIER =
  'f770f246-2b80-4b4f-8f0c-c9a86aeca3b3';
export const REASON_CALL_REASONS_FIELD_UNIVERSAL_IDENTIFIER =
  'b4aa4966-9426-436c-94b3-1e7dac004661';

export default defineField({
  universalIdentifier: CALL_REASON_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    CALL_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'reason',
  label: 'Reason',
  icon: 'IconMoodSmile',
  relationTargetObjectMetadataUniversalIdentifier:
    REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    REASON_CALL_REASONS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'reasonId',
  },
});
