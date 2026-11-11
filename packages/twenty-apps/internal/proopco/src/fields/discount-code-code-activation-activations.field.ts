import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  CODE_ACTIVATION_CODE_FIELD_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_CODE_ACTIVATION_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/code-activation-code.field';

export default defineField({
  universalIdentifier: DISCOUNT_CODE_CODE_ACTIVATION_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'activations',
  label: 'Activations',
  icon: 'IconTicket',
  relationTargetObjectMetadataUniversalIdentifier:
    CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CODE_ACTIVATION_CODE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
