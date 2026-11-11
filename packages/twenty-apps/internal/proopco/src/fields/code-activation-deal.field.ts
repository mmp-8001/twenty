import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CODE_ACTIVATION_DEAL_FIELD_UNIVERSAL_IDENTIFIER =
  '78464209-aa79-4bff-8143-c6dc43bb4281';
export const OPPORTUNITY_CODE_ACTIVATION_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER =
  '01fbaf25-534f-4026-8140-db5902c58a93';

export default defineField({
  universalIdentifier: CODE_ACTIVATION_DEAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'deal',
  label: 'Deal',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    OPPORTUNITY_CODE_ACTIVATION_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'dealId',
  },
});
