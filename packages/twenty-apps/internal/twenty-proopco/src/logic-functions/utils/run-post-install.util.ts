import { type MetadataApiClient } from 'twenty-client-sdk/metadata';

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
}: {
  metadataClient: Pick<MetadataApiClient, 'query' | 'mutation'>;
}) => {
  await deactivateOpportunity(metadataClient);
};
