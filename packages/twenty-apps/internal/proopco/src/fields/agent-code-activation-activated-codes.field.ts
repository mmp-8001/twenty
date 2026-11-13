import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  CODE_ACTIVATION_ACTIVATING_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  AGENT_CODE_ACTIVATION_ACTIVATED_CODES_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/code-activation-activating-agent.field';

export default defineField({
  universalIdentifier: AGENT_CODE_ACTIVATION_ACTIVATED_CODES_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'activatedCodes',
  label: 'Activated codes',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier:
    CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CODE_ACTIVATION_ACTIVATING_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
