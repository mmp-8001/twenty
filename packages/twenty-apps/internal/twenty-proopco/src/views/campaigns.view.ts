import { defineView, ViewType } from 'twenty-sdk/define';

import {
  CAMPAIGNS_VIEW_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_MESSAGE_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_SENT_AT_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_RECIPIENT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
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
      universalIdentifier: '9cf8bd63-80ef-4020-b280-e49351119781',
      fieldMetadataUniversalIdentifier:
        CAMPAIGN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '8342292c-5640-48cd-bd0e-b3424c713e95',
      fieldMetadataUniversalIdentifier:
        CAMPAIGN_MESSAGE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'f5c6a54e-000b-4444-b8b1-b621ca4e1027',
      fieldMetadataUniversalIdentifier:
        CAMPAIGN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '14d6a888-e181-4fae-b131-920bda584aa1',
      fieldMetadataUniversalIdentifier:
        CAMPAIGN_SENT_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '4457687c-b0dc-4dc1-8c6b-8e9700f93920',
      fieldMetadataUniversalIdentifier:
        CAMPAIGN_RECIPIENT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 160,
    },
  ],
});
