import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { CALL_AGENT_FIELD_UNIVERSAL_IDENTIFIER, AGENT_CALLS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/call-agent.field';

export default defineField({
  universalIdentifier: AGENT_CALLS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'calls',
  label: 'Calls',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier:
    CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CALL_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
