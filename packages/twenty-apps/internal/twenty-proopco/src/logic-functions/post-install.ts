import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { definePostInstallLogicFunction } from 'twenty-sdk/define';

import { PROOPCO_POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { runPostInstall } from 'src/logic-functions/utils/run-post-install.util';

export const postInstallHandler = async () => {
  await runPostInstall({
    client: new CoreApiClient({ runAs: 'application' }),
    metadataClient: new MetadataApiClient(),
  });

  return {};
};

export default definePostInstallLogicFunction({
  universalIdentifier: PROOPCO_POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'post-install',
  description:
    'Seeds default Followup Types and Commission Tiers when empty and deactivates Opportunity.',
  timeoutSeconds: 120,
  shouldRunSynchronously: true,
  handler: postInstallHandler,
});
