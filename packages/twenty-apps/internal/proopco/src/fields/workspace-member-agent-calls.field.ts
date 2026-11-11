import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { CALL_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER, WORKSPACE_MEMBER_AGENT_CALLS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/call-agent-member.field';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_AGENT_CALLS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'agentCalls',
  label: 'Agent calls',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CALL_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
