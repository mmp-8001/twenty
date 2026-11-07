import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { describe, expect, it } from 'vitest';

import { postSyncRoute } from './post-sync-route';
import { readManifestLogicFunctionNamesOrThrow } from './read-manifest-logic-function-names-or-throw';
import {
  assignSeededRoles,
  SEEDED_AGENT_EMAIL,
  signIn,
  userRequest,
} from './seeded-sessions';
import { query } from './sales-core-helpers';
import { TEST_SYNC_TOKEN } from './test-constants';

const runId = Date.now().toString(36);
const id = (name: string) => `${name}-${runId}`;

const sync = async (
  items: unknown[],
  token: string | null = TEST_SYNC_TOKEN,
) => {
  const execution = await postSyncRoute({
    headers: token === null ? {} : { 'x-proopco-sync-token': token },
    body: { items },
  });

  expect(execution.status).toBe(200);

  return execution.data as {
    success: boolean;
    error?: string;
    results?: { status: string; reason?: string; retryable?: boolean }[];
  };
};

const user = (suffix: string, data: Record<string, unknown> = {}) => ({
  type: 'user',
  proopcoId: id(`user-${suffix}`),
  data: { firstName: 'Ada', email: `${id(suffix)}@example.com`, ...data },
});

const statuses = (response: Awaited<ReturnType<typeof sync>>) =>
  response.results?.map((result) => result.status);

describe('twenty-proopco sync route', () => {
  it('deploys every logic function the manifest declares', async () => {
    const { findManyLogicFunctions } = await new MetadataApiClient().query({
      findManyLogicFunctions: { name: true },
    });
    const deployedNames = findManyLogicFunctions.map(
      (logicFunction: { name: string }) => logicFunction.name,
    );

    for (const name of await readManifestLogicFunctionNamesOrThrow()) {
      expect(deployedNames).toContain(name);
    }
  });

  it.each([[null], ['wrong-token']])('rejects token %s', async (token) => {
    const response = await sync([user('rejected')], token);

    expect(response).toEqual({ success: false, error: 'Invalid sync token' });
  });

  it('creates, then reports unchanged, then updates a User', async () => {
    const item = user('upsert', { purchaseCount: 1, birthday: '1990-05-17' });

    expect(statuses(await sync([item]))).toEqual(['created']);
    expect(statuses(await sync([item]))).toEqual(['unchanged']);

    const changed = { ...item, data: { ...item.data, purchaseCount: 2 } };

    expect(statuses(await sync([changed]))).toEqual(['updated']);
  });

  it('creates users, accounts and payments, and a full resend changes nothing', async () => {
    const batch = [
      {
        type: 'payment',
        proopcoId: id('payment-1'),
        data: {
          userProopcoId: id('user-linked'),
          accountProopcoId: id('account-1'),
          amountToman: 8_500_000,
          amountUsdt: 99.5,
          paidAt: '2026-01-02T03:04:05Z',
        },
      },
      {
        type: 'account',
        proopcoId: id('account-1'),
        data: {
          userProopcoId: id('user-linked'),
          status: 'failed',
          failureReason: 'max_drawdown',
        },
      },
      user('linked', { totalPaidUsdt: 99.5, lastLoginAt: '2026-01-03T00:00:00Z' }),
    ];

    expect(statuses(await sync(batch))).toEqual(['created', 'created', 'created']);
    expect(statuses(await sync(batch))).toEqual([
      'unchanged',
      'unchanged',
      'unchanged',
    ]);

    const { payments, challengeAccounts } = await query({
      payments: {
        __args: { filter: { proopcoId: { eq: id('payment-1') } } },
        edges: { node: { amountToman: true, amountUsdt: true } },
      },
      challengeAccounts: {
        __args: { filter: { proopcoId: { eq: id('account-1') } } },
        edges: { node: { status: true, failureReason: true } },
      },
    });

    expect(Number(payments?.edges?.[0]?.node?.amountToman)).toBe(8_500_000);
    expect(Number(payments?.edges?.[0]?.node?.amountUsdt)).toBe(99.5);
    expect(challengeAccounts?.edges?.[0]?.node).toEqual({
      status: 'failed',
      failureReason: 'max_drawdown',
    });
  });

  it('returns a retryable error for a missing User and still applies the rest', async () => {
    const orphan = {
      type: 'account',
      proopcoId: id('account-orphan'),
      data: { userProopcoId: id('user-missing'), status: 'active' },
    };
    const response = await sync([orphan, user('beside-orphan')]);

    expect(response.results?.[0]).toMatchObject({
      status: 'error',
      retryable: true,
    });
    expect(response.results?.[1].status).toBe('created');
    expect(statuses(await sync([user('missing'), orphan]))).toEqual([
      'created',
      'created',
    ]);
  });

  it('reports a malformed item as an error without failing the rest of the batch', async () => {
    const response = await sync([
      { type: 'order', proopcoId: id('bad-type'), data: {} },
      user('beside-malformed'),
      {
        type: 'payment',
        proopcoId: id('payment-bad-amount'),
        data: {
          userProopcoId: id('user-beside-malformed'),
          amountToman: 'a lot',
          amountUsdt: 1,
          paidAt: '2026-01-02T03:04:05Z',
        },
      },
    ]);

    expect(response.success).toBe(true);
    expect(response.results?.[0]).toMatchObject({
      status: 'error',
      retryable: false,
    });
    expect(response.results?.[1].status).toBe('created');
    expect(response.results?.[2]).toMatchObject({
      status: 'error',
      retryable: false,
    });
  });

  it.each(['Sales Agent', 'Supervisor', 'Full Admin'])(
    'refuses %s updates and deletes on synced records',
    async (roleLabel) => {
      await sync([user('read-only', { kycStatus: 'verified' })]);

      const { people } = await query({
        people: {
          __args: { filter: { proopcoId: { eq: id('user-read-only') } } },
          edges: { node: { id: true } },
        },
      });
      const personId = people?.edges?.[0]?.node?.id;
      const { restore } = await assignSeededRoles([
        { email: SEEDED_AGENT_EMAIL, roleLabel },
      ]);

      try {
        const token = await signIn(SEEDED_AGENT_EMAIL);
        const update = await userRequest({
          token,
          query: `mutation ($id: UUID!) {
            updatePerson(id: $id, data: { kycStatus: "tampered" }) { id }
          }`,
          variables: { id: personId },
        });
        const destroy = await userRequest({
          token,
          query: `mutation ($id: UUID!) { deletePerson(id: $id) { id } }`,
          variables: { id: personId },
        });

        expect(update.errors?.length).toBeGreaterThan(0);
        expect(destroy.errors?.length).toBeGreaterThan(0);
      } finally {
        await restore();
      }

      expect(statuses(await sync([user('read-only', { kycStatus: 'verified' })]))).toEqual([
        'unchanged',
      ]);
    },
  );
});
