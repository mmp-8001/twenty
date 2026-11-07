import { describe, expect, it } from 'vitest';

import { type RecordsClient } from 'src/logic-functions/utils/list-records.util';
import { readPersonDetails } from 'src/logic-functions/utils/read-person-details.util';

const clientWith = (rowsByCollection: Record<string, unknown[]>): RecordsClient =>
  ({
    query: async (request: Record<string, unknown>) => {
      const [collection] = Object.keys(request);

      return {
        [collection]: {
          edges: (rowsByCollection[collection] ?? []).map((node) => ({ node })),
          pageInfo: { hasNextPage: false },
        },
      };
    },
  }) as unknown as RecordsClient;

describe('readPersonDetails', () => {
  const appClient = clientWith({
    challengeAccounts: [{ id: 'a1', proopcoId: 'acc-1' }],
    offerActivations: [{ id: 'o1', status: 'ACTIVE' }],
  });

  it('answers a User the caller can see with accounts and activations', async () => {
    const result = await readPersonDetails({
      userClient: clientWith({ people: [{ id: 'p1' }] }),
      appClient,
      personId: 'p1',
    });

    expect(result).toMatchObject({ success: true, accounts: [{ id: 'a1' }], activations: [{ id: 'o1' }] });
  });

  it('answers a User outside the caller scope as not found and leaks nothing', async () => {
    const result = await readPersonDetails({ userClient: clientWith({ people: [] }), appClient, personId: 'p1' });

    expect(result).toEqual({ success: false, error: 'User not found' });
  });
});
