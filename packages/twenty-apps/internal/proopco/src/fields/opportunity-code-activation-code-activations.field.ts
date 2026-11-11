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
  CODE_ACTIVATION_DEAL_FIELD_UNIVERSAL_IDENTIFIER,
  OPPORTUNITY_CODE_ACTIVATION_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/code-activation-deal.field';

export default defineField({
  universalIdentifier: OPPORTUNITY_CODE_ACTIVATION_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.RELATION,
  name: 'codeActivations',
  label: 'Code activations',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier:
    CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CODE_ACTIVATION_DEAL_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
