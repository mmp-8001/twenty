import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  REASON_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { CALL_DO_NOT_CONTACT_REASON_FIELD_UNIVERSAL_IDENTIFIER, REASON_DO_NOT_CONTACT_CALLS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/call-do-not-contact-reason.field';

export default defineField({
  universalIdentifier: REASON_DO_NOT_CONTACT_CALLS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'doNotContactCalls',
  label: 'Do not contact calls',
  icon: 'IconBan',
  relationTargetObjectMetadataUniversalIdentifier:
    CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CALL_DO_NOT_CONTACT_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
