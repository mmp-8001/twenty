import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  CALL_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { CALL_REASON_CALL_FIELD_UNIVERSAL_IDENTIFIER, CALL_CALL_REASONS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/call-reason-call.field';

export default defineField({
  universalIdentifier: CALL_CALL_REASONS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'callReasons',
  label: 'Call reasons',
  icon: 'IconPhone',
  relationTargetObjectMetadataUniversalIdentifier:
    CALL_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CALL_REASON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
