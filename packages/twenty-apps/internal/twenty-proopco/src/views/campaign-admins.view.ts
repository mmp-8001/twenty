import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ADMIN_ON_CAMPAIGN_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ADMIN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ADMIN_REMOVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ADMINS_VIEW_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ON_CAMPAIGN_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: CAMPAIGN_ADMINS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Campaign Admins',
  objectUniversalIdentifier: CAMPAIGN_ADMIN_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconUserPlus',
  position: 0,
  fields: [
    {
      universalIdentifier: 'c023527c-3593-4232-ae3a-ae33c34f1adc',
      fieldMetadataUniversalIdentifier:
        CAMPAIGN_ON_CAMPAIGN_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'b4863e8d-c654-4fa2-ae31-b4c5cc5ed7ef',
      fieldMetadataUniversalIdentifier:
        ADMIN_ON_CAMPAIGN_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'd161c6a4-3039-4383-a744-e0e6194ac6e9',
      fieldMetadataUniversalIdentifier:
        CAMPAIGN_ADMIN_REMOVED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
  ],
});
