import {
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

import { AGENT_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export const WORKSPACE_MEMBER_AGENT_FIELD_UNIVERSAL_IDENTIFIER =
  '57ea0036-0d2f-4549-bdb8-b229db8b6d93';
export const AGENT_MEMBERS_FIELD_UNIVERSAL_IDENTIFIER =
  'a7c18050-c674-4d99-952a-b30d87420c53';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'agent',
  label: 'Agent',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AGENT_MEMBERS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'agentId',
  },
});
