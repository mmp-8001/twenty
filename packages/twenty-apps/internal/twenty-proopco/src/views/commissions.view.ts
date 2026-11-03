import { defineView, ViewType } from 'twenty-sdk/define';

import {
  COMMISSIONS_VIEW_UNIVERSAL_IDENTIFIER,
  COMMISSION_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  COMMISSION_RATE_APPLIED_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_TIER_NAME_APPLIED_FIELD_UNIVERSAL_IDENTIFIER,
  OWNER_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: COMMISSIONS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Commissions',
  objectUniversalIdentifier: COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconCoin',
  position: 0,
  fields: [
    {
      universalIdentifier: '7b273e00-16a0-432f-95c0-e15b6f4c73ce',
      fieldMetadataUniversalIdentifier:
        COMMISSION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'b13be092-dd6c-4295-9f59-905b9830899a',
      fieldMetadataUniversalIdentifier:
        COMMISSION_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'cabf4eb8-b352-478f-8774-f1e63604c64b',
      fieldMetadataUniversalIdentifier:
        OWNER_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '298ada1e-a68d-4e9a-bc45-a3b65c27e2de',
      fieldMetadataUniversalIdentifier:
        COMMISSION_RATE_APPLIED_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '82f76d07-a428-4da3-9adb-c1fe12b3dd2b',
      fieldMetadataUniversalIdentifier:
        COMMISSION_TIER_NAME_APPLIED_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 160,
    },
  ],
});
