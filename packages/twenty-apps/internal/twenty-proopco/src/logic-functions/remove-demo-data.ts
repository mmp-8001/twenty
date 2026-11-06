import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import { REMOVE_DEMO_DATA_ROUTE_PATH } from 'src/constants/demo-data.constant';
import { PROOPCO_REMOVE_DEMO_DATA_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { removeDemoData } from 'src/logic-functions/utils/remove-demo-data.util';

export const removeDemoDataHandler = async () => ({
  success: true,
  ...(await removeDemoData({
    client: new CoreApiClient({ runAs: 'application' }),
  })),
});

export default defineLogicFunction({
  universalIdentifier:
    PROOPCO_REMOVE_DEMO_DATA_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-remove-demo-data',
  description: 'Deletes every record the demo data seed created.',
  timeoutSeconds: 120,
  handler: removeDemoDataHandler,
  httpRouteTriggerSettings: {
    path: REMOVE_DEMO_DATA_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
