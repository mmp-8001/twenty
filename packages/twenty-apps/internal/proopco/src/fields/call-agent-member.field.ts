import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CALL_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER =
  'c857a019-9d32-4d9f-8c54-0d2a1ed83bbd';
export const WORKSPACE_MEMBER_AGENT_CALLS_FIELD_UNIVERSAL_IDENTIFIER =
  'e214aa9c-22b7-41b6-82cd-419207406a9b';

export default defineField({
  universalIdentifier: CALL_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'agentMember',
  label: 'Agent member',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    WORKSPACE_MEMBER_AGENT_CALLS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'agentMemberId',
  },
});
