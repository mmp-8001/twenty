import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CALL_CONTACT_OWNER_FIELD_UNIVERSAL_IDENTIFIER =
  '0bb27f4b-0621-45ab-ab99-3f7586eb1b69';
export const AGENT_CONTACT_OWNED_CALLS_FIELD_UNIVERSAL_IDENTIFIER =
  '9aff5474-4e74-479c-bd1e-4e09b6393983';

export default defineField({
  universalIdentifier: CALL_CONTACT_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'contactOwner',
  label: 'Contact owner',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AGENT_CONTACT_OWNED_CALLS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'contactOwnerId',
  },
});
