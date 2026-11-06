import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { type LogicFunctionExecutionContext } from 'twenty-sdk/logic-function';

import { SEED_DEMO_DATA_ROUTE_PATH } from 'src/constants/demo-data.constant';
import { PROOPCO_SEED_DEMO_DATA_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  MissingSettingError,
  readMoneySettings,
} from 'src/logic-functions/utils/read-app-settings.util';
import { seedDemoData } from 'src/logic-functions/utils/seed-demo-data.util';

export const seedDemoDataHandler = async (
  _payload: unknown,
  context: LogicFunctionExecutionContext,
) => {
  if (!context.workspaceMemberId) {
    return {
      success: false,
      error: 'Only a workspace member can seed demo data',
    };
  }

  try {
    const { errors } = await seedDemoData({
      client: new CoreApiClient({ runAs: 'application' }),
      ownerId: context.workspaceMemberId,
      settings: readMoneySettings(),
      now: new Date(),
    });

    return errors.length > 0
      ? { success: false, error: errors.join('; ') }
      : { success: true };
  } catch (error) {
    if (error instanceof MissingSettingError) {
      return { success: false, error: error.message };
    }

    throw error;
  }
};

export default defineLogicFunction({
  universalIdentifier:
    PROOPCO_SEED_DEMO_DATA_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-seed-demo-data',
  description:
    'Creates demo Traders, Trading Accounts, Payments, Followups, a Commission and a Monthly Income, all with a demo- proopcoId.',
  timeoutSeconds: 120,
  handler: seedDemoDataHandler,
  httpRouteTriggerSettings: {
    path: SEED_DEMO_DATA_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
