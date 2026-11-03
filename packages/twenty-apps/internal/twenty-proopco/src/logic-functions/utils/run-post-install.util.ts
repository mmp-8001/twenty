import { type MetadataApiClient } from 'twenty-client-sdk/metadata';

import {
  DEFAULT_COMMISSION_TIERS,
  DEFAULT_FOLLOWUP_TYPES,
} from 'src/constants/proopco-jobs.constant';
import {
  createRecord,
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/list-records.util';

// Seeds an object only while it is empty, so reinstalls keep manager edits.
const seedWhenEmpty = async (
  client: RecordsClient,
  collection: string,
  singular: string,
  defaults: Record<string, unknown>[],
) => {
  if ((await listRecords(client, collection, {}, {})).length > 0) {
    return;
  }

  for (const data of defaults) {
    await createRecord(client, singular, data);
  }
};

// Deactivating keeps the data and every user's navigation items intact.
const deactivateOpportunity = async (
  metadataClient: Pick<MetadataApiClient, 'query' | 'mutation'>,
) => {
  const { objects } = await metadataClient.query({
    objects: {
      __args: { filter: {}, paging: { first: 200 } },
      edges: { node: { id: true, nameSingular: true, isActive: true } },
    },
  });
  const opportunity = objects.edges.find(
    ({ node }) => node.nameSingular === 'opportunity',
  )?.node;

  if (opportunity?.isActive) {
    await metadataClient.mutation({
      updateOneObject: {
        __args: { input: { id: opportunity.id, update: { isActive: false } } },
        id: true,
      },
    });
  }
};

export const runPostInstall = async ({
  client,
  metadataClient,
}: {
  client: RecordsClient;
  metadataClient: Pick<MetadataApiClient, 'query' | 'mutation'>;
}) => {
  await seedWhenEmpty(client, 'followupTypes', 'FollowupType', DEFAULT_FOLLOWUP_TYPES);
  await seedWhenEmpty(client, 'commissionTiers', 'CommissionTier', DEFAULT_COMMISSION_TIERS);
  await deactivateOpportunity(metadataClient);
};
