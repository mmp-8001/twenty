import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const MONTHLY_INCOME_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER =
  '23c98d43-7637-4ef8-8aac-5480cc2fc41b';
export const WORKSPACE_MEMBER_AGENT_MONTHLY_INCOMES_FIELD_UNIVERSAL_IDENTIFIER =
  '21446209-97c6-4515-88b4-3fb3cdd294e7';

export default defineField({
  universalIdentifier: MONTHLY_INCOME_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'agentMember',
  label: 'Agent member',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACE_MEMBER_AGENT_MONTHLY_INCOMES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'agentMemberId',
  },
});
