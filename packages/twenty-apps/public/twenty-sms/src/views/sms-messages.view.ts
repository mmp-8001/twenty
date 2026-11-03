import { defineView, ViewType } from 'twenty-sdk/define';

import {
  MESSAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  MESSAGES_VIEW_UNIVERSAL_IDENTIFIER,
  MSG_TO_UNIVERSAL_IDENTIFIER,
  MSG_BODY_UNIVERSAL_IDENTIFIER,
  MSG_STATUS_UNIVERSAL_IDENTIFIER,
  MSG_SOURCE_REF_UNIVERSAL_IDENTIFIER,
  MSG_SENT_AT_UNIVERSAL_IDENTIFIER,
  MSG_ERROR_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: MESSAGES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'SMS Messages',
  objectUniversalIdentifier: MESSAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconMessage',
  position: 0,
  fields: [
    {
      universalIdentifier: '1bee047b-ac3d-4875-be1a-5224bb0c2054',
      fieldMetadataUniversalIdentifier: MSG_TO_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'c7d529d9-6c46-438d-b0ee-2553c9c523a8',
      fieldMetadataUniversalIdentifier: MSG_BODY_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'c30cb559-0c2c-4d6a-98bb-db8648274966',
      fieldMetadataUniversalIdentifier: MSG_STATUS_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '1a7972ec-1ca6-4b0d-97f8-5b9451e6e54c',
      fieldMetadataUniversalIdentifier: MSG_SOURCE_REF_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '3fd83cbc-5507-4cee-8fbe-15cfc2562ad8',
      fieldMetadataUniversalIdentifier: MSG_SENT_AT_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '653b21e3-57ad-4a70-972f-d241e69415e5',
      fieldMetadataUniversalIdentifier: MSG_ERROR_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 160,
    },
  ],
});
