import { type CoreApiClient } from 'twenty-client-sdk/core';

export type RecordsClient = Pick<CoreApiClient, 'query' | 'mutation'>;

const PAGE_SIZE = 200;

type Page<TNode> = {
  edges?: { node?: TNode }[];
  pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
};

export const listRecords = async <TNode>(
  client: RecordsClient,
  collection: string,
  filter: Record<string, unknown>,
  selection: Record<string, unknown>,
): Promise<TNode[]> => {
  const nodes: TNode[] = [];
  let after: string | undefined;

  for (;;) {
    const result = (await client.query({
      [collection]: {
        __args: { filter, first: PAGE_SIZE, ...(after ? { after } : {}) },
        edges: { node: { id: true, ...selection } },
        pageInfo: { hasNextPage: true, endCursor: true },
      },
    })) as unknown as Record<string, Page<TNode> | undefined>;
    const page = result[collection];

    for (const edge of page?.edges ?? []) {
      if (edge.node) {
        nodes.push(edge.node);
      }
    }

    if (!page?.pageInfo?.hasNextPage || !page.pageInfo.endCursor) {
      return nodes;
    }

    after = page.pageInfo.endCursor;
  }
};

export const updateRecord = async (
  client: RecordsClient,
  singular: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> => {
  await client.mutation({
    [`update${singular}`]: { __args: { id, data }, id: true },
  });
};

export const createRecord = async (
  client: RecordsClient,
  singular: string,
  data: Record<string, unknown>,
): Promise<string> => {
  const result = (await client.mutation({
    [`create${singular}`]: { __args: { data }, id: true },
  })) as unknown as Record<string, { id: string }>;

  return result[`create${singular}`].id;
};
