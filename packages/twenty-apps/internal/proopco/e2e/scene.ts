import { randomUUID } from 'crypto';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { runEligibilityRefresh } from '../src/logic-functions/utils/refresh-eligibility.util';
import { createRecord, listRecords } from '../src/logic-functions/utils/records.util';
import {
  addAgentToCampaign,
  addSegmentToCampaign,
  createAgent,
  createCampaign,
  createSegment,
  createSegmentView,
  deleteView,
  linkMemberToAgent,
  listMembers,
  softDelete,
} from '../src/__tests__/fixtures';

export const E2E_USER_EMAIL = 'tim@apple.dev';

const client = new CoreApiClient();
const metadata = new MetadataApiClient();

export type Scene = {
  memberId: string;
  agentId: string;
  personId: string;
  personName: string;
  created: { singular: string; id: string }[];
  viewId: string;
};

// One eligible free contact in a campaign the e2e user's Agent belongs to.
export const createScene = async (): Promise<Scene> => {
  const created: Scene['created'] = [];
  const track = async (singular: string, id: Promise<string>) => {
    const resolved = await id;

    created.push({ singular, id: resolved });

    return resolved;
  };
  const memberId = (await listMembers(client)).find(({ userEmail }) => userEmail === E2E_USER_EMAIL)!.id;
  const country = `E2E-${randomUUID()}`;
  const viewId = await createSegmentView([{ fieldName: 'country', operand: 'CONTAINS', value: country }]);
  const segmentId = await track('Segment', createSegment(client, viewId));
  const campaignId = await track('Campaign', createCampaign(client, { startsAt: '2026-01-01' }));

  await track('CampaignSegment', addSegmentToCampaign(client, campaignId, segmentId));

  const agentId = await track('Agent', createAgent(client, `E2E agent ${randomUUID().slice(0, 6)}`));

  await linkMemberToAgent(client, memberId, agentId);
  await track('CampaignAgent', addAgentToCampaign(client, campaignId, agentId));

  const lastName = randomUUID().slice(0, 8);
  const personId = await track(
    'Person',
    createRecord(client, 'Person', { name: { firstName: 'Eetoe', lastName }, platformUserId: `u_${randomUUID()}`, country }),
  );

  await runEligibilityRefresh(new Date(), client, metadata);

  return { memberId, agentId, personId, personName: `Eetoe ${lastName}`, created, viewId };
};

export const cleanUpScene = async ({ memberId, personId, created, viewId }: Scene) => {
  await linkMemberToAgent(client, memberId, null);

  for (const collection of ['opportunities', 'calls'] as const) {
    for (const { id } of await listRecords<{ id: string }>(client, collection, collection === 'calls' ? { contactId: { eq: personId } } : { pointOfContactId: { eq: personId } }, {})) {
      created.push({ singular: collection === 'calls' ? 'Call' : 'Opportunity', id });
    }
  }

  for (const { singular, id } of [...created].reverse()) {
    await softDelete(client, singular, id).catch(() => undefined);
  }

  await deleteView(viewId);
};
