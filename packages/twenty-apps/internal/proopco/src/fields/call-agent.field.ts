import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CALL_AGENT_FIELD_UNIVERSAL_IDENTIFIER =
  '19982d96-518a-48c4-a273-f02434647e53';
export const AGENT_CALLS_FIELD_UNIVERSAL_IDENTIFIER =
  '6b5ace55-4033-4fd9-be08-9fb0253b9848';

export default defineField({
  universalIdentifier: CALL_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'agent',
  label: 'Agent',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AGENT_CALLS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'agentId',
  },
});
