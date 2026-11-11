import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  FREEZE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FREEZE_PERIOD_AGENT_FIELD_UNIVERSAL_IDENTIFIER, AGENT_FREEZE_PERIOD_FREEZE_PERIODS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/freeze-period-agent.field';

export default defineField({
  universalIdentifier: AGENT_FREEZE_PERIOD_FREEZE_PERIODS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'freezePeriods',
  label: 'Freeze periods',
  icon: 'IconSnowflake',
  relationTargetObjectMetadataUniversalIdentifier: FREEZE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: FREEZE_PERIOD_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
