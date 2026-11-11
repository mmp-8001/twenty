import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { CALL_CONTACT_FIELD_UNIVERSAL_IDENTIFIER, PERSON_CALLS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/call-contact.field';

export default defineField({
  universalIdentifier: PERSON_CALLS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'calls',
  label: 'Calls',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier:
    CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CALL_CONTACT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
