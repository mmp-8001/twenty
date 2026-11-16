import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  FREEZE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const FREEZE_PERIOD_AGENT_FIELD_UNIVERSAL_IDENTIFIER =
  'd52993e3-a7eb-46e4-9475-cde76589c13e';
export const AGENT_FREEZE_PERIOD_FREEZE_PERIODS_FIELD_UNIVERSAL_IDENTIFIER =
  'e0e7969e-059d-4d72-ad98-297dfea31c83';

export default defineField({
  universalIdentifier: FREEZE_PERIOD_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: FREEZE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'agent',
  label: 'Agent',
  icon: 'IconSnowflake',
  relationTargetObjectMetadataUniversalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: AGENT_FREEZE_PERIOD_FREEZE_PERIODS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'agentId',
  },
});
