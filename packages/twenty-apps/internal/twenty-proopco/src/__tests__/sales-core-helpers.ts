import { CoreApiClient } from 'twenty-client-sdk/core';

import {
  COMMISSION_ROUTE_PATH,
  MILLISECONDS_PER_DAY,
} from 'src/constants/proopco-jobs.constant';
import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { metadataRequest } from './metadata-request';
import { postRoute, postSyncRoute } from './post-sync-route';
import { TEST_SYNC_TOKEN } from './test-constants';

export const core = new CoreApiClient();
export const tokenHeaders = { 'x-proopco-sync-token': TEST_SYNC_TOKEN };

const runId = Date.now().toString(36);
let counter = 0;

export const uniqueId = (name: string) => `${name}-${runId}-${(counter += 1)}`;
export const daysFromNow = (days: number, from = Date.now()) =>
  new Date(from + days * MILLISECONDS_PER_DAY).toISOString();

// Records come back loosely typed from the generated client.
type Loose = Record<string, any>;

// The API key is limited to 100 requests per 60 seconds.
const requestTimes: number[] = [];

export const throttle = async () => {
  for (;;) {
    const now = Date.now();

    while (requestTimes.length > 0 && now - requestTimes[0] > 60_000) {
      requestTimes.shift();
    }

    if (requestTimes.length < 80) {
      requestTimes.push(now);

      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};

export const query = async (request: Record<string, unknown>): Promise<Loose> => {
  await throttle();

  return (await core.query(request as never)) as Loose;
};

export const mutate = async (request: Record<string, unknown>): Promise<Loose> => {
  await throttle();

  return (await core.mutation(request as never)) as Loose;
};

let cachedMemberId: string | undefined;

export const firstMemberId = async (): Promise<string> => {
  if (cachedMemberId) {
    return cachedMemberId;
  }

  const { workspaceMembers } = await query({
    workspaceMembers: { __args: { first: 1 }, edges: { node: { id: true } } },
  });

  cachedMemberId = workspaceMembers.edges[0].node.id as string;

  return cachedMemberId;
};

const traderProopcoIds = new Map<string, string>();

export const createTrader = async (suffix: string): Promise<string> => {
  const proopcoId = uniqueId(`trader-${suffix}`);
  const response = await postSyncRoute({
    headers: tokenHeaders,
    body: {
      items: [
        {
          type: 'trader',
          proopcoId,
          data: { firstName: 'Ada', lastName: suffix, email: `${proopcoId}@example.com` },
        },
      ],
    },
  });

  if (response.data.results?.[0]?.status !== 'created') {
    throw new Error(`Trader not created: ${JSON.stringify(response.data)}`);
  }

  const { people } = await query({
    people: {
      __args: { filter: { proopcoId: { eq: proopcoId } } },
      edges: { node: { id: true } },
    },
  });

  traderProopcoIds.set(people.edges[0].node.id, proopcoId);

  return people.edges[0].node.id;
};

const followupTypeIds = new Map<string, string>();

export const findFollowupTypeId = async (name: string): Promise<string> => {
  const cached = followupTypeIds.get(name);

  if (cached) {
    return cached;
  }

  const { followupTypes } = await query({
    followupTypes: {
      __args: { filter: { name: { eq: name } } },
      edges: { node: { id: true } },
    },
  });

  followupTypeIds.set(name, followupTypes.edges[0].node.id);

  return followupTypes.edges[0].node.id;
};

export const createFollowup = async (data: {
  traderId: string;
  ownerId?: string | null;
  stage?: string;
  typeName?: string;
  createdAt?: string;
  expiresAt?: string;
  retryExpiresAt?: string;
}): Promise<string> => {
  const { typeName = 'Sales', ...rest } = data;
  const { createFollowup: created } = await mutate({
    createFollowup: {
      __args: {
        data: {
          name: uniqueId('followup'),
          stage: 'PENDING',
          followupTypeId: await findFollowupTypeId(typeName),
          ...rest,
        },
      },
      id: true,
    },
  });

  return created.id;
};

export const getFollowup = async (id: string): Promise<Loose> => {
  const { followup } = await query({
    followup: {
      __args: { filter: { id: { eq: id } } },
      id: true,
      stage: true,
      ownerId: true,
      expiresAt: true,
      retryExpiresAt: true,
      failureReason: true,
    },
  });

  return followup;
};

// Payments are not writable through the API, so they arrive the way proopco sends them.
export const createPayment = async (data: {
  traderId: string;
  kind?: string;
  amountUsd: number;
  paidAt?: string;
}): Promise<string> => {
  const proopcoId = uniqueId('payment');
  const response = await postSyncRoute({
    headers: tokenHeaders,
    body: {
      items: [
        {
          type: 'payment',
          proopcoId,
          data: {
            traderProopcoId: traderProopcoIds.get(data.traderId),
            amountUsd: data.amountUsd,
            kind: (data.kind ?? 'PURCHASE').toLowerCase(),
            paidAt: data.paidAt ?? new Date().toISOString(),
          },
        },
      ],
    },
  });

  if (response.data.results?.[0]?.status !== 'created') {
    throw new Error(`Payment not created: ${JSON.stringify(response.data)}`);
  }

  const { payments } = await query({
    payments: {
      __args: { filter: { proopcoId: { eq: proopcoId } } },
      edges: { node: { id: true } },
    },
  });

  return payments.edges[0].node.id;
};

export const runCommission = async (paymentId: string) =>
  (
    await postRoute({
      path: COMMISSION_ROUTE_PATH,
      headers: tokenHeaders,
      body: { paymentId },
    })
  ).data as { status: string; reason?: string };

export const commissionsOfPayment = async (paymentId: string): Promise<Loose[]> => {
  const { commissions } = await query({
    commissions: {
      __args: { filter: { paymentId: { eq: paymentId } } },
      edges: {
        node: {
          id: true,
          ownerId: true,
          followupId: true,
          rateApplied: true,
          tierName: true,
          basis: true,
          scope: true,
          monthlyIncomeId: true,
          amount: { amountMicros: true, currencyCode: true },
        },
      },
    },
  });

  return commissions.edges.map(({ node }: { node: Loose }) => node);
};

export const setAppVariable = async (key: string, value: string) => {
  await throttle();
  const { findManyApplications } = await metadataRequest<{
    findManyApplications: { id: string; universalIdentifier: string }[];
  }>('{ findManyApplications { id universalIdentifier } }');
  const application = findManyApplications.find(
    ({ universalIdentifier }) => universalIdentifier === APPLICATION_UNIVERSAL_IDENTIFIER,
  );

  await metadataRequest(
    `mutation ($applicationId: UUID, $key: String!, $value: String!) {
      updateOneApplicationVariable(applicationId: $applicationId, key: $key, value: $value)
    }`,
    { applicationId: application?.id, key, value },
  );
};

export const waitFor = async <TValue>(
  read: () => Promise<TValue | undefined>,
  timeoutMs = 60_000,
): Promise<TValue> => {
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    const value = await read();

    if (value !== undefined) {
      return value;
    }

    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for the condition');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};
