import {
  FieldType,
  OnDeleteAction,
  RelationType,
  defineField,
} from 'twenty-sdk/define';

import {
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CAMPAIGN_AGENT_AGENT_FIELD_UNIVERSAL_IDENTIFIER =
  'fb0516af-9160-4490-91f3-d0e926dc6ff4';
export const AGENT_CAMPAIGN_AGENTS_FIELD_UNIVERSAL_IDENTIFIER =
  'b51589a9-95f9-459e-a858-ef9a70ca57a4';

export default defineField({
  universalIdentifier: CAMPAIGN_AGENT_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CAMPAIGN_AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'agent',
  label: 'Agent',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AGENT_CAMPAIGN_AGENTS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'agentId',
  },
});
