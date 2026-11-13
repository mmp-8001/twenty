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

export const AUDIT_LOG_TO_AGENT_FIELD_UNIVERSAL_IDENTIFIER =
  '99949252-92b2-4a20-ba56-f6b2c8cca064';
export const AGENT_AUDIT_LOG_TO_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER =
  '2da80dbe-9f84-42af-9e66-baf6faa4933a';

export default defineField({
  universalIdentifier: AUDIT_LOG_TO_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'toAgent',
  label: 'To agent',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: AGENT_AUDIT_LOG_TO_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'toAgentId',
  },
});
