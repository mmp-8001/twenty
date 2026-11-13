import { FieldType, RelationType, defineField } from 'twenty-sdk/define';

import {
  CAMPAIGN_AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  CAMPAIGN_AGENT_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_CAMPAIGN_AGENTS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/campaign-agent-campaign.field';

export default defineField({
  universalIdentifier: CAMPAIGN_CAMPAIGN_AGENTS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'campaignAgents',
  label: 'Agents',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier:
    CAMPAIGN_AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CAMPAIGN_AGENT_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
