import { CoreApiClient } from 'twenty-client-sdk/core';
import { definePostInstallLogicFunction } from 'twenty-sdk/define';

import { POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { ensureSeedReasons } from 'src/logic-functions/utils/ensure-seed-reasons.util';
import { ensureSettings } from 'src/logic-functions/utils/ensure-settings.util';

export default definePostInstallLogicFunction({
  universalIdentifier: POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'post-install',
  description: 'Creates the Proopco settings record and the seed Reasons when they are missing.',
  timeoutSeconds: 120,
  shouldRunSynchronously: true,
  shouldRunOnVersionUpgrade: true,
  handler: async () => {
    const client = new CoreApiClient({ runAs: 'application' });

    await ensureSettings(client);
    await ensureSeedReasons(client);

    return {};
  },
});
