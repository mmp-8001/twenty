import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  OFFER_ACTIVATIONS_ON_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  OFFER_ACTIVATION_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: OFFER_ACTIVATIONS_ON_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: OFFER_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'offerActivations',
  label: 'Offer Activations',
  icon: 'IconTicket',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: OFFER_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: OFFER_ACTIVATION_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
