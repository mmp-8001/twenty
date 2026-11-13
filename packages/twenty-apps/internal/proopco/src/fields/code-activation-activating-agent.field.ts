import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CODE_ACTIVATION_ACTIVATING_AGENT_FIELD_UNIVERSAL_IDENTIFIER =
  '709398b0-e3a3-40c4-a9ea-75896c97f6df';
export const AGENT_CODE_ACTIVATION_ACTIVATED_CODES_FIELD_UNIVERSAL_IDENTIFIER =
  '9ab1704b-15ab-4830-93f8-957b404dfea5';

export default defineField({
  universalIdentifier: CODE_ACTIVATION_ACTIVATING_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'activatingAgent',
  label: 'Activating agent',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AGENT_CODE_ACTIVATION_ACTIVATED_CODES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'activatingAgentId',
  },
});
