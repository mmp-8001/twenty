import { CoreApiClient } from 'twenty-client-sdk/core';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { metadataRequest } from './metadata-request';
import { TEST_SYNC_TOKEN } from './test-constants';

export const core = new CoreApiClient();
export const tokenHeaders = { 'x-proopco-sync-token': TEST_SYNC_TOKEN };

const runId = Date.now().toString(36);
let counter = 0;

export const uniqueId = (name: string) => `${name}-${runId}-${(counter += 1)}`;

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

// Each test file counts its own requests, so the window can already be full from the previous file.
const withRateLimitRetry = async (send: () => Promise<unknown>): Promise<Loose> => {
  for (let attempt = 1; ; attempt += 1) {
    await throttle();

    try {
      return (await send()) as Loose;
    } catch (error) {
      if (attempt === 20 || !String(error).includes('Rate limit exceeded')) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }
};

export const query = (request: Record<string, unknown>): Promise<Loose> =>
  withRateLimitRetry(() => core.query(request as never));

export const mutate = (request: Record<string, unknown>): Promise<Loose> =>
  withRateLimitRetry(() => core.mutation(request as never));

let cachedMemberId: string | undefined;

export const firstMemberId = async (): Promise<string> => {
  if (cachedMemberId) {
    return cachedMemberId;
  }

  const { workspaceMembers } = await query({
    workspaceMembers: { __args: { first: 1, orderBy: [{ id: 'AscNullsFirst' }] }, edges: { node: { id: true } } },
  });

  cachedMemberId = workspaceMembers.edges[0].node.id as string;

  return cachedMemberId;
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

export const setServerVariable = async (key: string, value: string) => {
  await throttle();

  const { findApplicationRegistrationByUniversalIdentifier: registration } =
    await metadataRequest<{
      findApplicationRegistrationByUniversalIdentifier: { id: string };
    }>(
      `query ($universalIdentifier: String!) {
        findApplicationRegistrationByUniversalIdentifier(universalIdentifier: $universalIdentifier) { id }
      }`,
      { universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER },
    );
  const { findApplicationRegistrationVariables: variables } =
    await metadataRequest<{
      findApplicationRegistrationVariables: { id: string; key: string }[];
    }>(
      `query ($id: String!) {
        findApplicationRegistrationVariables(applicationRegistrationId: $id) { id key }
      }`,
      { id: registration.id },
    );
  const variable = variables.find((candidate) => candidate.key === key);

  if (!variable) {
    throw new Error(`${key} server variable does not exist`);
  }

  await metadataRequest(
    `mutation ($input: UpdateApplicationRegistrationVariableInput!) {
      updateApplicationRegistrationVariable(input: $input) { id }
    }`,
    { input: { id: variable.id, update: { value } } },
  );
};

export const throttledMetadataRequest = async <TData>(
  request: string,
  variables: Record<string, unknown> = {},
): Promise<TData> => {
  await throttle();

  return metadataRequest<TData>(request, variables);
};
