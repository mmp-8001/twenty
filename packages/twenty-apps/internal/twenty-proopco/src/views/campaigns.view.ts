import { defineView, ViewType } from 'twenty-sdk/define';

import {
  CAMPAIGN_AVAILABLE_USER_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_COOLDOWN_DAYS_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ENDS_AT_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_STARTS_AT_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGNS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: CAMPAIGNS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Campaigns',
  objectUniversalIdentifier: CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconSpeakerphone',
  position: 0,
  fields: [
    {
      universalIdentifier: 'f25ee05a-8bf1-44d4-8329-1e6b13ca1241',
      fieldMetadataUniversalIdentifier:
        CAMPAIGN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '04816d99-3695-4e27-b9b5-0c7eca2effa0',
      fieldMetadataUniversalIdentifier:
        CAMPAIGN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'f2165454-7a3d-4418-bb56-252fe735dfc5',
      fieldMetadataUniversalIdentifier:
        CAMPAIGN_STARTS_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '7805afa7-7586-4c2d-a03f-a8c17931b7f8',
      fieldMetadataUniversalIdentifier:
        CAMPAIGN_ENDS_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '0e6cea3c-d835-467a-a004-74b4fac93195',
      fieldMetadataUniversalIdentifier:
        CAMPAIGN_COOLDOWN_DAYS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '6194a348-f217-4904-a33d-9c65254f9d36',
      fieldMetadataUniversalIdentifier:
        CAMPAIGN_AVAILABLE_USER_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 160,
    },
  ],
});
