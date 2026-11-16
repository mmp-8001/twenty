import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const AUDIT_LOG_CALL_FIELD_UNIVERSAL_IDENTIFIER =
  '8f18506d-22d0-4562-af9d-4dca6e3f04df';
export const CALL_AUDIT_LOG_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER =
  '2c8d1770-a318-4530-a9e0-7e39da9f0154';

export default defineField({
  universalIdentifier: AUDIT_LOG_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'call',
  label: 'Call',
  icon: 'IconPhone',
  relationTargetObjectMetadataUniversalIdentifier: CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: CALL_AUDIT_LOG_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'callId',
  },
});
