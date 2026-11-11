import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';

export const applicationClients = () => ({
  client: new CoreApiClient({ runAs: 'application' }),
  metadata: new MetadataApiClient({ runAs: 'application' }),
});
