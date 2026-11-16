import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CODE_ACTIVATION_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER =
  'c65e8c30-98af-42f3-a8c8-3a98f98bc96e';
export const WORKSPACE_MEMBER_CODE_ACTIVATION_AGENT_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER =
  '580eb2f8-8609-4ee0-b23b-d9bb43196c65';

export default defineField({
  universalIdentifier: CODE_ACTIVATION_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'agentMember',
  label: 'Agent member',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    WORKSPACE_MEMBER_CODE_ACTIVATION_AGENT_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'agentMemberId',
  },
});
