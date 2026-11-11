import { FieldType, RelationType, defineField } from 'twenty-sdk/define';

import {
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  CAMPAIGN_AGENT_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  AGENT_CAMPAIGN_AGENTS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/campaign-agent-agent.field';

export default defineField({
  universalIdentifier: AGENT_CAMPAIGN_AGENTS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'campaignAgents',
  label: 'Campaigns',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier:
    CAMPAIGN_AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CAMPAIGN_AGENT_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
