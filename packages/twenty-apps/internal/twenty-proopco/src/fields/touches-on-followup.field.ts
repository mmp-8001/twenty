import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  TOUCH_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
  TOUCH_OBJECT_UNIVERSAL_IDENTIFIER,
  TOUCHES_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: TOUCHES_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'touches',
  label: 'Touches',
  icon: 'IconCalendarTime',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: TOUCH_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    TOUCH_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
