import { defineView, ViewType } from 'twenty-sdk/define';

import {
  TRADER_ON_TRADING_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNTS_VIEW_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNT_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNT_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: TRADING_ACCOUNTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Trading Accounts',
  objectUniversalIdentifier: TRADING_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconChartCandle',
  position: 0,
  fields: [
    {
      universalIdentifier: '901ebffb-91ab-4a65-a332-7be421229aab',
      fieldMetadataUniversalIdentifier:
        TRADING_ACCOUNT_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '7da8e57e-937d-4af8-8f91-ad3f0f70ed17',
      fieldMetadataUniversalIdentifier:
        TRADER_ON_TRADING_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'ae1adf2b-8906-4b6e-94b6-9ae0a73d2c3a',
      fieldMetadataUniversalIdentifier:
        TRADING_ACCOUNT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '44d00c21-a86c-4d74-879a-a2fc7b7998cd',
      fieldMetadataUniversalIdentifier:
        TRADING_ACCOUNT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: '475147c1-c7ee-4cf8-a1ff-eeac2119f35b',
      fieldMetadataUniversalIdentifier:
        TRADING_ACCOUNT_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 200,
    },
  ],
});
