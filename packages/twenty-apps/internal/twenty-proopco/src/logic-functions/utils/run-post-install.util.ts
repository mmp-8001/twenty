import { type MetadataApiClient } from 'twenty-client-sdk/metadata';

import {
  createRecord,
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/list-records.util';

// DATA_MODEL section 9. The positive reasons are not in the spec; they let a satisfied call be recorded until the Full Admin edits the list.
const FAILURE_REASON_TITLES = [
  'Wrong contact details',
  'Not a trader / referral only',
  'Asked not to be contacted',
];
const FEEDBACK_REASONS = [
  ...[
    'Not interested',
    'Price too high',
    'Not enough knowledge',
    'Waiting for budget',
    'Challenge rules too hard',
    'Bought from other platforms',
  ].map((title) => ({ title, sentiment: 'NEGATIVE', isOther: false })),
  { title: 'Other', sentiment: 'NEGATIVE', isOther: true },
  { title: 'Satisfied', sentiment: 'POSITIVE', isOther: false },
  { title: 'Other', sentiment: 'POSITIVE', isOther: true },
];

// Only an empty list is seeded, so a reinstall never brings back a reason the Full Admin removed.
const seedWhenEmpty = async (
  client: RecordsClient,
  collection: string,
  singular: string,
  rows: Record<string, unknown>[],
) => {
  if ((await listRecords(client, collection, {}, {})).length > 0) {
    return;
  }

  for (const [sortOrder, row] of rows.entries()) {
    await createRecord(client, singular, { ...row, isActive: true, sortOrder });
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
  metadataClient,
  client,
}: {
  metadataClient: Pick<MetadataApiClient, 'query' | 'mutation'>;
  client: RecordsClient;
}) => {
  await deactivateOpportunity(metadataClient);
  await seedWhenEmpty(
    client,
    'failureReasons',
    'FailureReason',
    FAILURE_REASON_TITLES.map((title) => ({ title })),
  );
  await seedWhenEmpty(client, 'feedbackReasons', 'FeedbackReason', FEEDBACK_REASONS);
};
