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
  CODE_ACTIVATION_CONTACT_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_CODE_ACTIVATION_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/code-activation-contact.field';

export default defineField({
  universalIdentifier: PERSON_CODE_ACTIVATION_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'codeActivations',
  label: 'Code activations',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier:
    CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CODE_ACTIVATION_CONTACT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
