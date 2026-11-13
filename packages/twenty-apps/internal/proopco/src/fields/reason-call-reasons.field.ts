import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  CALL_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  REASON_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { CALL_REASON_REASON_FIELD_UNIVERSAL_IDENTIFIER, REASON_CALL_REASONS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/call-reason-reason.field';

export default defineField({
  universalIdentifier: REASON_CALL_REASONS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'callReasons',
  label: 'Call reasons',
  icon: 'IconMoodSmile',
  relationTargetObjectMetadataUniversalIdentifier:
    CALL_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CALL_REASON_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
