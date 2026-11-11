import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export const PURCHASE_CREDITED_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER =
  '160565bf-ae71-48c1-a203-ee4ce60c27c6';
export const WORKSPACE_MEMBER_CREDITED_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER =
  '348abb25-4d15-4115-b0fa-3aaf32c4f62e';

export default defineField({
  universalIdentifier: PURCHASE_CREDITED_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'creditedAgentMember',
  label: 'Credited agent member',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    WORKSPACE_MEMBER_CREDITED_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'creditedAgentMemberId',
  },
});
