import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  SWEEP_ROUTE_PATH,
  TRACK_ROUTE_PATH,
} from 'src/constants/proopco-jobs.constant';

import {
  createFollowup,
  createTrader,
  findFollowupTypeId,
  daysFromNow,
  firstMemberId,
  getFollowup,
  mutate,
  query,
  throttle,
  tokenHeaders,
  uniqueId,
} from './sales-core-helpers';
import { postRoute, postSyncRoute } from './post-sync-route';
import {
  assignSeededRoles,
  SEEDED_AGENT_EMAIL,
  signIn,
  userRequest,
} from './seeded-sessions';

// Track is an authenticated route; the API key stands in for a session.
const track = async (body: Record<string, unknown>) => {
  await throttle();

  return (
    await postRoute({
      path: TRACK_ROUTE_PATH,
      headers: {
        ...tokenHeaders,
        authorization: `Bearer ${process.env.TWENTY_API_KEY}`,
      },
      body,
    })
  ).data as { success: boolean; error?: string; followupId?: string };
};

const sweep = async (referenceDate: string) =>
  (
    await postRoute({
      path: SWEEP_ROUTE_PATH,
      headers: tokenHeaders,
      body: { referenceDate },
    })
  ).data as { success: boolean; updated: number };

describe('Track', () => {
  it('creates a Pending Followup expiring after the type expiryDays', async () => {
    const traderId = await createTrader('track');
    const ownerId = await firstMemberId();
    const before = Date.now();
    const result = await track({ traderId, ownerId });

    expect(result.success).toBe(true);

    const followup = await getFollowup(result.followupId!);
    const { followupTypes } = await query({
      followupTypes: {
        __args: { filter: { name: { eq: 'Sales' } } },
        edges: { node: { expiryDays: true } },
      },
    });
    const expiryDays = followupTypes.edges[0].node.expiryDays;

    expect(followup).toMatchObject({ stage: 'PENDING', ownerId });
    expect(
      Math.abs(
        new Date(followup.expiresAt).getTime() -
          (before + expiryDays * 86_400_000),
      ),
    ).toBeLessThan(60_000);
  });

  it('refuses a Trader with a Pending Followup', async () => {
    const traderId = await createTrader('track-twice');
    const ownerId = await firstMemberId();

    expect((await track({ traderId, ownerId })).success).toBe(true);
    expect(await track({ traderId, ownerId })).toMatchObject({
      success: false,
      error: expect.stringContaining('active Followup'),
    });
  });

  it('lets only one of two simultaneous Tracks succeed', async () => {
    const traderId = await createTrader('track-race');
    const ownerId = await firstMemberId();
    const results = await Promise.all([
      track({ traderId, ownerId }),
      track({ traderId, ownerId }),
    ]);

    expect(results.filter(({ success }) => success)).toHaveLength(1);
  });

  it('frees the Trader when an active Followup is edited to Failed', async () => {
    const traderId = await createTrader('track-key-sync');
    const ownerId = await firstMemberId();
    const { followupId } = await track({ traderId, ownerId });

    await mutate({
      updateFollowup: {
        __args: { id: followupId, data: { stage: 'FAILED' } },
        id: true,
      },
    });
    await vi.waitFor(async () => {
      expect((await track({ traderId, ownerId })).success).toBe(true);
    }, { timeout: 30_000, interval: 1_000 });
  });

  it('refuses a Trader whose Followup sits in the Pool', async () => {
    const traderId = await createTrader('track-pool');

    await createFollowup({
      traderId,
      ownerId: null,
      stage: 'RETRY_PENDING',
      retryExpiresAt: daysFromNow(3),
    });

    expect((await track({ traderId, ownerId: await firstMemberId() })).success).toBe(false);
  });

  it('allows a new Track once the earlier Followup ended', async () => {
    const traderId = await createTrader('track-after-fail');

    await createFollowup({ traderId, stage: 'FAILED' });

    expect((await track({ traderId, ownerId: await firstMemberId() })).success).toBe(true);
  });

  it('rejects a call without the token or a workspace member', async () => {
    const traderId = await createTrader('track-anonymous');
    const response = await postRoute({
      path: TRACK_ROUTE_PATH,
      headers: {},
      body: { traderId },
    });

    expect(response.data.success).not.toBe(true);
  });
});

describe('Retry Pending', () => {
  it('moves the Succeeded Followup to Retry Pending, keeping the owner', async () => {
    const traderId = await createTrader('retry');
    const ownerId = await firstMemberId();
    const followupId = await createFollowup({ traderId, ownerId, stage: 'SUCCEEDED' });
    const { people } = await query({
      people: {
        __args: { filter: { id: { eq: traderId } } },
        edges: { node: { proopcoId: true } },
      },
    });
    const before = Date.now();
    const response = await postSyncRoute({
      headers: tokenHeaders,
      body: {
        items: [
          {
            type: 'tradingAccount',
            proopcoId: uniqueId('account-failed'),
            data: {
              traderProopcoId: people.edges[0].node.proopcoId,
              status: 'failed',
              failureReason: 'max_drawdown',
            },
          },
        ],
      },
    });

    expect(response.data.results[0].status).toBe('created');

    const followup = await getFollowup(followupId);

    expect(followup).toMatchObject({ stage: 'RETRY_PENDING', ownerId });
    expect(
      Math.abs(new Date(followup.retryExpiresAt).getTime() - (before + 7 * 86_400_000)),
    ).toBeLessThan(120_000);
  });
});

describe('Sweep', () => {
  it('expires, pools and expires again as the reference date advances', async () => {
    const ownerId = await firstMemberId();
    const referenceDate = daysFromNow(2);
    const [pendingDue, pendingLater, retryDue, poolDue, poolLater] = await Promise.all(
      [
        createFollowup({ traderId: await createTrader('sweep-a'), ownerId, expiresAt: daysFromNow(1) }),
        createFollowup({ traderId: await createTrader('sweep-b'), ownerId, expiresAt: daysFromNow(30) }),
        createFollowup({ traderId: await createTrader('sweep-c'), ownerId, stage: 'RETRY_PENDING', retryExpiresAt: daysFromNow(1) }),
        createFollowup({ traderId: await createTrader('sweep-d'), ownerId: null, stage: 'RETRY_PENDING', retryExpiresAt: daysFromNow(1) }),
        createFollowup({ traderId: await createTrader('sweep-e'), ownerId: null, stage: 'RETRY_PENDING', retryExpiresAt: daysFromNow(30) }),
      ],
    );

    expect((await sweep(referenceDate)).success).toBe(true);

    expect(await getFollowup(pendingDue)).toMatchObject({ stage: 'EXPIRED' });
    expect(await getFollowup(pendingLater)).toMatchObject({ stage: 'PENDING' });

    const pooled = await getFollowup(retryDue);

    expect(pooled).toMatchObject({ stage: 'RETRY_PENDING', ownerId: null });
    expect(new Date(pooled.retryExpiresAt).toISOString()).toBe(daysFromNow(7, new Date(referenceDate).getTime()));
    expect(await getFollowup(poolDue)).toMatchObject({
      stage: 'EXPIRED',
      failureReason: 'NOT_FOLLOWED_UP',
    });
    expect(await getFollowup(poolLater)).toMatchObject({ stage: 'RETRY_PENDING' });

    // A second run at the same date changes nothing.
    await sweep(referenceDate);
    expect(await getFollowup(retryDue)).toMatchObject({ stage: 'RETRY_PENDING', ownerId: null });
  });

  it('rejects a call without the token', async () => {
    const response = await postRoute({ path: SWEEP_ROUTE_PATH, headers: {}, body: {} });

    expect(response.data).toEqual({ success: false, error: 'Invalid sync token' });
  });
});

describe('Agent marks a Followup Failed', () => {
  it('stores the failure reason', async () => {
    const followupId = await createFollowup({ traderId: await createTrader('failed') });

    await mutate({
      updateFollowup: {
        __args: { id: followupId, data: { stage: 'FAILED', failureReason: 'NOT_INTERESTED' } },
        id: true,
      },
    });

    expect(await getFollowup(followupId)).toMatchObject({
      stage: 'FAILED',
      failureReason: 'NOT_INTERESTED',
    });
  });
});

describe('Followup creation guard', () => {
  let restoreRoles: () => Promise<void>;
  let agentId: string;
  let agentToken: string;

  beforeAll(async () => {
    const assigned = await assignSeededRoles([
      { email: SEEDED_AGENT_EMAIL, roleLabel: 'Sales Agent' },
    ]);

    restoreRoles = assigned.restore;
    agentId = assigned.memberIds[SEEDED_AGENT_EMAIL];
    agentToken = await signIn(SEEDED_AGENT_EMAIL);
  });

  afterAll(async () => {
    await restoreRoles?.();
  });

  const exists = async (id: string) =>
    (
      await query({
        followups: {
          __args: { filter: { id: { eq: id } } },
          edges: { node: { id: true } },
        },
      })
    ).followups.edges.length === 1;

  it('removes a Followup an agent creates directly and keeps one made by Track', async () => {
    const traderId = await createTrader('guard-agent');
    const { data, errors } = await userRequest<{
      createFollowup: { id: string };
    }>({
      token: agentToken,
      query: `mutation ($data: FollowupCreateInput!) { createFollowup(data: $data) { id } }`,
      variables: {
        data: {
          name: uniqueId('agent-followup'),
          stage: 'PENDING',
          traderId,
          ownerId: agentId,
          followupTypeId: await findFollowupTypeId('Sales'),
        },
      },
    });

    expect(errors).toBeUndefined();

    const agentFollowupId = data!.createFollowup.id;
    const tracked = await track({
      traderId: await createTrader('guard-track'),
      ownerId: agentId,
    });

    expect(tracked.success).toBe(true);
    await vi.waitFor(
      async () => expect(await exists(agentFollowupId)).toBe(false),
      {
        timeout: 30_000,
        interval: 1_000,
      },
    );
    expect(await exists(tracked.followupId!)).toBe(true);
  });
});
