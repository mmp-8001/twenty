import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  OFFER_SETS_ON_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_SET_OBJECT_UNIVERSAL_IDENTIFIER,
  OFFER_SET_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: OFFER_SETS_ON_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: OFFER_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'offerSets',
  label: 'Offer Sets',
  icon: 'IconListDetails',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: OFFER_SET_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: OFFER_SET_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
