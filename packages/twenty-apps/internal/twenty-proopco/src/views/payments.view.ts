import { defineView, ViewType } from 'twenty-sdk/define';

import {
  PAYMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  PAYMENT_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_KIND_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  PAYMENT_PAID_AT_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
  TRADER_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: PAYMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Payments',
  objectUniversalIdentifier: PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconCash',
  position: 0,
  fields: [
    {
      universalIdentifier: '533ddbc8-cd04-4d70-9935-7dfba706f09b',
      fieldMetadataUniversalIdentifier:
        PAYMENT_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '000cda59-8355-4403-92aa-a223ed1f344a',
      fieldMetadataUniversalIdentifier:
        TRADER_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'c1d3a2c2-74c6-4b65-8bb2-bd0be2797fe2',
      fieldMetadataUniversalIdentifier:
        PAYMENT_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'd4e8d18a-653b-4e04-be83-6fee995d6082',
      fieldMetadataUniversalIdentifier: PAYMENT_KIND_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '73cba096-bdcf-4e9e-bf4d-ea629373e5cf',
      fieldMetadataUniversalIdentifier:
        PAYMENT_PAID_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 160,
    },
  ],
});
