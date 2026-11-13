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

export const AUDIT_LOG_SUBJECT_AGENT_FIELD_UNIVERSAL_IDENTIFIER =
  '5674e101-af50-4cad-9788-4bf57bb508c1';
export const AGENT_AUDIT_LOG_SUBJECT_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER =
  '22035528-d235-4187-9e8c-87224387060a';

export default defineField({
  universalIdentifier: AUDIT_LOG_SUBJECT_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'subjectAgent',
  label: 'Subject agent',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: AGENT_AUDIT_LOG_SUBJECT_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'subjectAgentId',
  },
});
