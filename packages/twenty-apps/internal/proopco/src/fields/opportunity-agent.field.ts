import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const OPPORTUNITY_AGENT_FIELD_UNIVERSAL_IDENTIFIER =
  '87421e43-0749-4b53-9636-b73ec358f555';
export const AGENT_DEALS_FIELD_UNIVERSAL_IDENTIFIER =
  '9cc0fc34-2020-47c2-a1d1-3919314c1afd';

export default defineField({
  universalIdentifier: OPPORTUNITY_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.RELATION,
  name: 'agent',
  label: 'Agent',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AGENT_DEALS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'agentId',
  },
});
