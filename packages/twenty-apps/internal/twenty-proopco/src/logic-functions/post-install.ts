import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { definePostInstallLogicFunction } from 'twenty-sdk/define';

import { PROOPCO_POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { runPostInstall } from 'src/logic-functions/utils/run-post-install.util';

export const postInstallHandler = async () => {
  await runPostInstall({
    metadataClient: new MetadataApiClient(),
  });

  return {};
};

export default definePostInstallLogicFunction({
  universalIdentifier: PROOPCO_POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'post-install',
  description:
    'Deactivates Opportunity.',
  timeoutSeconds: 120,
  shouldRunSynchronously: true,
  // Every step is idempotent.
  shouldRunOnVersionUpgrade: true,
  handler: postInstallHandler,
});
