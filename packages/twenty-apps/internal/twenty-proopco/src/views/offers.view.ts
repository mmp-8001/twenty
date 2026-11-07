import { defineView, ViewType } from 'twenty-sdk/define';

import {
  OFFER_CAPABILITY_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_OBJECT_UNIVERSAL_IDENTIFIER,
  OFFER_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
  OFFERS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: OFFERS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Offers',
  objectUniversalIdentifier: OFFER_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconDiscount2',
  position: 0,
  fields: [
    {
      universalIdentifier: 'e9504248-ca5e-41b5-86d3-cea12393961e',
      fieldMetadataUniversalIdentifier: OFFER_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '229a77a6-18e1-45fe-929f-ba8f947648a2',
      fieldMetadataUniversalIdentifier: OFFER_CAPABILITY_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'fbdaa874-424d-423e-915b-44666fbb8ec4',
      fieldMetadataUniversalIdentifier: OFFER_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'b410d59e-a941-4dbc-bcbb-f1c932066009',
      fieldMetadataUniversalIdentifier: OFFER_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 120,
    },
  ],
});
