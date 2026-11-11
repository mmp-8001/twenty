import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER =
  'd9b95d37-c51c-41f8-a88a-716c9fd390dd';
export const WORKSPACE_MEMBER_AGENT_DEALS_FIELD_UNIVERSAL_IDENTIFIER =
  '3c845f1a-9e31-41db-9e83-29bbd75173c6';

export default defineField({
  universalIdentifier: OPPORTUNITY_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.RELATION,
  name: 'agentMember',
  label: 'Agent member',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    WORKSPACE_MEMBER_AGENT_DEALS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'agentMemberId',
  },
});
