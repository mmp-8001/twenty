import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  REASON_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CALL_DO_NOT_CONTACT_REASON_FIELD_UNIVERSAL_IDENTIFIER =
  '12cfa7bb-96c3-45c2-ae1b-d506f65201c6';
export const REASON_DO_NOT_CONTACT_CALLS_FIELD_UNIVERSAL_IDENTIFIER =
  '28340ee6-9518-4c56-8ce4-3975b77ad912';

export default defineField({
  universalIdentifier: CALL_DO_NOT_CONTACT_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'doNotContactReason',
  label: 'Do not contact reason',
  icon: 'IconBan',
  relationTargetObjectMetadataUniversalIdentifier:
    REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    REASON_DO_NOT_CONTACT_CALLS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'doNotContactReasonId',
  },
});
