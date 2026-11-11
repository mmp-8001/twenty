import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  CAMPAIGN_AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_AGENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: CAMPAIGN_AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'campaignAgent',
  namePlural: 'campaignAgents',
  labelSingular: 'Campaign agent',
  labelPlural: 'Campaign agents',
  description: 'Links an agent to a campaign',
  icon: 'IconHeadset',
  labelIdentifierFieldMetadataUniversalIdentifier:
    CAMPAIGN_AGENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: CAMPAIGN_AGENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
      defaultValue: "''",
    },
  ],
});
