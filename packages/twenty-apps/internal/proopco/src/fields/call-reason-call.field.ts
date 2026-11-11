import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CALL_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CALL_REASON_CALL_FIELD_UNIVERSAL_IDENTIFIER =
  'c891df88-6f8d-4ccd-858d-0ca6ea24eca7';
export const CALL_CALL_REASONS_FIELD_UNIVERSAL_IDENTIFIER =
  '04b9460d-2b7a-4c1f-badb-5d1303780220';

export default defineField({
  universalIdentifier: CALL_REASON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    CALL_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'call',
  label: 'Call',
  icon: 'IconPhone',
  relationTargetObjectMetadataUniversalIdentifier:
    CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CALL_CALL_REASONS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'callId',
  },
});
