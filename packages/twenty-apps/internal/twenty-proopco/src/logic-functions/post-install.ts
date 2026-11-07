import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { definePostInstallLogicFunction } from 'twenty-sdk/define';

import { PROOPCO_POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { runPostInstall } from 'src/logic-functions/utils/run-post-install.util';

export const postInstallHandler = async () => {
  await runPostInstall({
    metadataClient: new MetadataApiClient(),
    client: new CoreApiClient({ runAs: 'application' }),
  });

  return {};
};

export default definePostInstallLogicFunction({
  universalIdentifier: PROOPCO_POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'post-install',
  description:
    'Deactivates Opportunity and seeds the reason lists.',
  timeoutSeconds: 120,
  shouldRunSynchronously: true,
  // Every step is idempotent.
  shouldRunOnVersionUpgrade: true,
  handler: postInstallHandler,
});
