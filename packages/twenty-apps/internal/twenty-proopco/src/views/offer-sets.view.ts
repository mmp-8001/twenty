import { defineView, ViewType } from 'twenty-sdk/define';

import {
  OFFER_SET_OBJECT_UNIVERSAL_IDENTIFIER,
  OFFER_SET_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_SET_SET_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_SETS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: OFFER_SETS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Offer Sets',
  objectUniversalIdentifier: OFFER_SET_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconListDetails',
  position: 0,
  fields: [
    {
      universalIdentifier: 'b4f0bee9-d27b-43ab-8377-8448132facc0',
      fieldMetadataUniversalIdentifier: OFFER_SET_SET_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '6aeb7812-aa70-46f4-8dab-2d5072ece875',
      fieldMetadataUniversalIdentifier: OFFER_SET_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 200,
    },
  ],
});
