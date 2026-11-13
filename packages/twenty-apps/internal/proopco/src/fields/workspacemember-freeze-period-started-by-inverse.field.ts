import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  FREEZE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FREEZE_PERIOD_STARTED_BY_FIELD_UNIVERSAL_IDENTIFIER, WORKSPACEMEMBER_FREEZE_PERIOD_STARTED_FREEZE_PERIODS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/freeze-period-started-by.field';

export default defineField({
  universalIdentifier: WORKSPACEMEMBER_FREEZE_PERIOD_STARTED_FREEZE_PERIODS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'startedFreezePeriods',
  label: 'Freeze periods (started)',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier: FREEZE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: FREEZE_PERIOD_STARTED_BY_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
