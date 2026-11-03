import { defineView, ViewType } from 'twenty-sdk/define';

import {
  COMMISSION_TIERS_VIEW_UNIVERSAL_IDENTIFIER,
  COMMISSION_TIER_MAX_DAY_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_TIER_MIN_DAY_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_TIER_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_TIER_OBJECT_UNIVERSAL_IDENTIFIER,
  COMMISSION_TIER_RATE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: COMMISSION_TIERS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Commission Tiers',
  objectUniversalIdentifier: COMMISSION_TIER_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconPercentage',
  position: 0,
  fields: [
    {
      universalIdentifier: '74644c4e-b996-40bc-8755-71e9b06ac009',
      fieldMetadataUniversalIdentifier:
        COMMISSION_TIER_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '3c868e94-2e8b-4bf9-8e2c-e9bd2da27438',
      fieldMetadataUniversalIdentifier:
        COMMISSION_TIER_MIN_DAY_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '0f662acf-b24b-4efa-82e0-3aaf8670f89b',
      fieldMetadataUniversalIdentifier:
        COMMISSION_TIER_MAX_DAY_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'b80b7b55-48fb-4e24-bca7-39cdf5a2a671',
      fieldMetadataUniversalIdentifier:
        COMMISSION_TIER_RATE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 160,
    },
  ],
});
