import { randomUUID } from 'crypto';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { metadataRequest } from './metadata-request';
import {
  createRecord,
  listRecords,
  updateRecord,
} from 'src/logic-functions/utils/records.util';

type MetadataObject = {
  id: string;
  nameSingular: string;
  fieldsList: { id: string; name: string }[];
};

export const findObject = async (nameSingular: string) => {
  const { objects } = await metadataRequest<{
    objects: { edges: { node: MetadataObject }[] };
  }>(
    '{ objects(paging: { first: 200 }) { edges { node { id nameSingular fieldsList { id name } } } } }',
  );
  const object = objects.edges.find(
    ({ node }) => node.nameSingular === nameSingular,
  )?.node;

  if (!object) {
    throw new Error(`Object ${nameSingular} not found`);
  }

  return object;
};

export type TestSegmentFilter = {
  fieldName: string;
  operand: string;
  value: string;
};

// A Segment rule is an ordinary saved Person view, built here the way the filter bar would.
export const createSegmentView = async (filters: TestSegmentFilter[]) => {
  const person = await findObject('person');
  const { createView } = await metadataRequest<{ createView: { id: string } }>(
    `mutation ($input: CreateViewInput!) { createView(input: $input) { id } }`,
    {
      input: {
        name: `test-segment-${randomUUID()}`,
        icon: 'IconFilter',
        objectMetadataId: person.id,
      },
    },
  );

  for (const { fieldName, operand, value } of filters) {
    const field = person.fieldsList.find(({ name }) => name === fieldName);

    await metadataRequest(
      `mutation ($input: CreateViewFilterInput!) { createViewFilter(input: $input) { id } }`,
      {
        input: {
          viewId: createView.id,
          fieldMetadataId: field?.id,
          operand,
          value,
        },
      },
    );
  }

  return createView.id;
};

export const deleteView = (id: string) =>
  metadataRequest('mutation ($id: String!) { deleteView(id: $id) }', { id });

export const listMembers = (client: CoreApiClient) =>
  listRecords<{ id: string; userEmail: string }>(
    client,
    'workspaceMembers',
    {},
    { userEmail: true },
  );

export const linkMemberToAgent = (
  client: CoreApiClient,
  memberId: string,
  agentId: string | null,
) => updateRecord(client, 'WorkspaceMember', memberId, { agentId });

export const createAgent = (client: CoreApiClient, name: string) =>
  createRecord(client, 'Agent', { name });

export const createSegment = async (client: CoreApiClient, viewId: string) =>
  createRecord(client, 'Segment', { name: `test ${randomUUID()}`, viewId });

export const createCampaign = (
  client: CoreApiClient,
  data: { startsAt: string; endsAt?: string | null; cooldownDays?: number },
) =>
  createRecord(client, 'Campaign', { name: `test ${randomUUID()}`, ...data });

export const addSegmentToCampaign = (
  client: CoreApiClient,
  campaignId: string,
  segmentId: string,
) => createRecord(client, 'CampaignSegment', { campaignId, segmentId });

export const addAgentToCampaign = (
  client: CoreApiClient,
  campaignId: string,
  agentId: string,
) => createRecord(client, 'CampaignAgent', { campaignId, agentId });

export const softDelete = (
  client: CoreApiClient,
  singular: string,
  id: string,
) =>
  client.mutation({
    [`delete${singular}`]: { __args: { id }, id: true },
  } as never);
