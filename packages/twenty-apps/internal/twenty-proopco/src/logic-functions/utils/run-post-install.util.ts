import { type MetadataApiClient } from 'twenty-client-sdk/metadata';

import { ACTIVE_FOLLOWUP_STAGES, type FollowupStage } from 'src/constants/followup.constant';
import { buildActiveTraderKey } from 'src/logic-functions/utils/build-active-trader-key.util';
import {
  DEFAULT_COMMISSION_TIERS,
  DEFAULT_FOLLOWUP_TYPES,
} from 'src/constants/proopco-jobs.constant';
import {
  createRecord,
  listRecords,
  type RecordsClient,
  updateRecord,
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

// Followups created before the key existed would escape the one-active-per-Trader
// index; a Trader that already holds an active key keeps it and the duplicate is left alone.
export const backfillActiveTraderKeys = async (client: RecordsClient) => {
  const activeFollowups = await listRecords<{
    id: string;
    stage: FollowupStage;
    traderId: string | null;
    activeTraderKey: string | null;
  }>(
    client,
    'followups',
    { stage: { in: ACTIVE_FOLLOWUP_STAGES } },
    { stage: true, traderId: true, activeTraderKey: true },
  );
  const takenKeys = new Set(
    activeFollowups.flatMap(({ activeTraderKey }) =>
      activeTraderKey ? [activeTraderKey] : [],
    ),
  );

  for (const followup of activeFollowups) {
    const activeTraderKey = buildActiveTraderKey(followup);

    if (followup.activeTraderKey || !activeTraderKey) {
      continue;
    }

    if (takenKeys.has(activeTraderKey)) {
      console.warn(
        `Skipped the active-trader key backfill for Followup ${followup.id}: Trader ${activeTraderKey} already has an active Followup`,
      );
      continue;
    }

    takenKeys.add(activeTraderKey);
    await updateRecord(client, 'Followup', followup.id, { activeTraderKey });
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
  await backfillActiveTraderKeys(client);
  await deactivateOpportunity(metadataClient);
};
