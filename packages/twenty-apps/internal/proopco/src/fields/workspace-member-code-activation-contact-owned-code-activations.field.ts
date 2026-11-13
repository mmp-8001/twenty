import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  CODE_ACTIVATION_CONTACT_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  WORKSPACE_MEMBER_CODE_ACTIVATION_CONTACT_OWNED_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/code-activation-contact-owner-member.field';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_CODE_ACTIVATION_CONTACT_OWNED_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'contactOwnedCodeActivations',
  label: 'Contact-owned code activations',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CODE_ACTIVATION_CONTACT_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
