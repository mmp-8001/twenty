import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { OPPORTUNITY_AGENT_FIELD_UNIVERSAL_IDENTIFIER, AGENT_DEALS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-agent.field';

export default defineField({
  universalIdentifier: AGENT_DEALS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'deals',
  label: 'Deals',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    OPPORTUNITY_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
