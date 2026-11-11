import { type CoreApiClient } from 'twenty-client-sdk/core';

export type RecordsClient = Pick<CoreApiClient, 'query' | 'mutation'>;

type Page<TNode> = {
  edges?: { node?: TNode }[];
  pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
};

const PAGE_SIZE = 200;

// The typed client only knows the schema of the install it was generated against,
// so collection names are dynamic and results are narrowed here, once.
export const listRecords = async <TNode>(
  client: RecordsClient,
  collection: string,
  filter: Record<string, unknown>,
  selection: Record<string, unknown>,
  limit = Number.POSITIVE_INFINITY,
): Promise<TNode[]> => {
  const nodes: TNode[] = [];
  let after: string | undefined;

  for (;;) {
    const result = (await client.query({
      [collection]: {
        __args: {
          filter,
          first: Math.min(PAGE_SIZE, limit - nodes.length),
          ...(after ? { after } : {}),
        },
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

    if (
      nodes.length >= limit ||
      !page?.pageInfo?.hasNextPage ||
      !page.pageInfo.endCursor
    ) {
      return nodes;
    }

    after = page.pageInfo.endCursor;
  }
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

export const updateRecordsWhere = async (
  client: RecordsClient,
  plural: string,
  filter: Record<string, unknown>,
  data: Record<string, unknown>,
): Promise<void> => {
  await client.mutation({
    [`update${plural}`]: { __args: { filter, data }, id: true },
  });
};
