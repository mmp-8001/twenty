import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { CALL_CONTACT_OWNER_FIELD_UNIVERSAL_IDENTIFIER, AGENT_CONTACT_OWNED_CALLS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/call-contact-owner.field';

export default defineField({
  universalIdentifier: AGENT_CONTACT_OWNED_CALLS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'contactOwnedCalls',
  label: 'Contact-owned calls',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CALL_CONTACT_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
