import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const AUDIT_LOG_FROM_AGENT_FIELD_UNIVERSAL_IDENTIFIER =
  '4292fa78-2d83-484d-9625-b4fb06921d94';
export const AGENT_AUDIT_LOG_FROM_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER =
  '1df33e99-64d0-4c83-9821-9c7f74cc1f76';

export default defineField({
  universalIdentifier: AUDIT_LOG_FROM_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'fromAgent',
  label: 'From agent',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: AGENT_AUDIT_LOG_FROM_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'fromAgentId',
  },
});
