import { CoreApiClient } from 'twenty-client-sdk/core';
import { definePostInstallLogicFunction } from 'twenty-sdk/define';

import { POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { ensureSettings } from 'src/logic-functions/utils/ensure-settings.util';

export default definePostInstallLogicFunction({
  universalIdentifier: POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'post-install',
  description: 'Creates the Proopco settings record when it is missing.',
  timeoutSeconds: 120,
  shouldRunSynchronously: true,
  shouldRunOnVersionUpgrade: true,
  handler: async () => {
    await ensureSettings(new CoreApiClient({ runAs: 'application' }));

    return {};
  },
});
