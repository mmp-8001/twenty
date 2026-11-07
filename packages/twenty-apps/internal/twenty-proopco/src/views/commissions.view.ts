import { defineView, ViewType } from 'twenty-sdk/define';

import {
  COMMISSIONS_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_VIEW_UNIVERSAL_IDENTIFIER,
  COMMISSION_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_COMMISSION_USDT_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  COMMISSION_PURCHASED_AT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: COMMISSIONS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Commissions',
  objectUniversalIdentifier: COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconCoin',
  position: 4,
  fields: [
    {
      universalIdentifier: COMMISSIONS_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: COMMISSION_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: COMMISSIONS_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: COMMISSION_PURCHASED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: COMMISSIONS_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: COMMISSION_COMMISSION_USDT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 140,
    },
  ],
});
