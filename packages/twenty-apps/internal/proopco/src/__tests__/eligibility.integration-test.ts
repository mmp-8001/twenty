import { randomUUID } from 'crypto';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { runSweeper } from 'src/logic-functions/platform-event-sweeper';
import {
  endCampaignNow,
  runEligibilityRefresh,
} from 'src/logic-functions/utils/refresh-eligibility.util';
import {
  recomputeContactEligibility,
  loadEligibilityPlan,
} from 'src/logic-functions/utils/eligibility.util';
import {
  createRecord,
  listRecords,
  updateRecord,
} from 'src/logic-functions/utils/records.util';

import { assertInvariants } from './assert-invariants';
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
} from './fixtures';

const client = new CoreApiClient();
const metadata = new MetadataApiClient();

// 2026-11-12 00:00 Tehran.
const DAY_ONE_MIDNIGHT = new Date('2026-11-11T20:30:00Z');
const DAY = 24 * 60 * 60 * 1000;

let memberId: string;
const created: { singular: string; id: string }[] = [];
const viewIds: string[] = [];
const linkedMemberIds: string[] = [];

const track = async (singular: string, id: Promise<string> | string) => {
  const resolved = await id;

  created.push({ singular, id: resolved });

  return resolved;
};

const refresh = (now: Date) => runEligibilityRefresh(now, client, metadata);

const newContact = (country: string, lifecycleStage = 'FREE') =>
  track(
    'Person',
    createRecord(client, 'Person', {
      name: { firstName: 'Test', lastName: country },
      platformUserId: `u_${randomUUID()}`,
      country,
      lifecycleStage,
    }),
  );

const eligibleMembersOf = async (personId: string) =>
  (
    await listRecords<{ eligibleMemberIds: string[] | null }>(
      client,
      'people',
      { id: { eq: personId } },
      { eligibleMemberIds: true },
    )
  )[0]?.eligibleMemberIds ?? [];

const readCampaign = async (campaignId: string) =>
  (
    await listRecords<{ status: string; endsAt: string | null }>(
      client,
      'campaigns',
      { id: { eq: campaignId } },
      { status: true, endsAt: true },
    )
  )[0];

// A campaign for one country, one agent linked to the first member, started at the clock's day one.
const setUpCampaign = async (
  country: string,
  options: { startsAt?: string } = {},
) => {
  const viewId = await createSegmentView([
    { fieldName: 'country', operand: 'CONTAINS', value: country },
  ]);

  viewIds.push(viewId);

  const agentId = await track('Agent', createAgent(client, `Agent ${country}`));

  await linkMemberToAgent(client, memberId, agentId);
  linkedMemberIds.push(memberId);

  const segmentId = await track('Segment', createSegment(client, viewId));
  const campaignId = await track(
    'Campaign',
    createCampaign(client, { startsAt: options.startsAt ?? '2026-11-12' }),
  );

  await track(
    'CampaignSegment',
    addSegmentToCampaign(client, campaignId, segmentId),
  );
  await track('CampaignAgent', addAgentToCampaign(client, campaignId, agentId));

  return { agentId, campaignId, segmentId };
};

beforeAll(async () => {
  memberId = (await listMembers(client))[0].id;
});

afterEach(async () => {
  await assertInvariants(client);

  for (const id of linkedMemberIds.splice(0)) {
    await linkMemberToAgent(client, id, null);
  }

  for (const { singular, id } of created.splice(0).reverse()) {
    await softDelete(client, singular, id);
  }

  for (const id of viewIds.splice(0)) {
    await deleteView(id);
  }
});

describe('eligibility of Free contacts', () => {
  it('grants the members of a campaign agent for contacts in its segment, and takes it back when the campaign ends', async () => {
    const country = `ZA-${randomUUID()}`;
    const { campaignId } = await setUpCampaign(country);
    const inSegment = await newContact(country);
    const outside = await newContact(`QQ-${randomUUID()}`);

    const result = await refresh(DAY_ONE_MIDNIGHT);

    expect(result.campaignsChanged).toBe(1);
    expect(await eligibleMembersOf(inSegment)).toEqual([memberId]);
    expect(await eligibleMembersOf(outside)).toEqual([]);

    await endCampaignNow(
      client,
      campaignId,
      new Date(DAY_ONE_MIDNIGHT.getTime() + 2 * DAY),
    );
    await refresh(new Date(DAY_ONE_MIDNIGHT.getTime() + 2 * DAY));

    expect(await readCampaign(campaignId)).toMatchObject({
      status: 'ENDED',
      endsAt: '2026-11-13',
    });
    expect(await eligibleMembersOf(inSegment)).toEqual([]);
  });

  it('moves the campaign to Active exactly at Tehran midnight', async () => {
    const country = `ZB-${randomUUID()}`;
    const { campaignId } = await setUpCampaign(country);
    const contact = await newContact(country);

    await refresh(new Date(DAY_ONE_MIDNIGHT.getTime() - 60_000));

    expect(await readCampaign(campaignId)).toMatchObject({
      status: 'SCHEDULED',
    });
    expect(await eligibleMembersOf(contact)).toEqual([]);

    await refresh(DAY_ONE_MIDNIGHT);

    expect(await readCampaign(campaignId)).toMatchObject({ status: 'ACTIVE' });
    expect(await eligibleMembersOf(contact)).toEqual([memberId]);
  });

  it('grants nothing through a frozen or inactive agent, or for a contact that is not Free', async () => {
    const country = `ZC-${randomUUID()}`;
    const { agentId } = await setUpCampaign(country);
    const free = await newContact(country);
    const inFollowUp = await newContact(country, 'IN_FOLLOW_UP');

    await refresh(DAY_ONE_MIDNIGHT);

    expect(await eligibleMembersOf(free)).toEqual([memberId]);
    expect(await eligibleMembersOf(inFollowUp)).toEqual([]);

    await updateRecord(client, 'Agent', agentId, {
      frozenSince: DAY_ONE_MIDNIGHT.toISOString(),
    });
    await refresh(DAY_ONE_MIDNIGHT);

    expect(await eligibleMembersOf(free)).toEqual([]);

    await updateRecord(client, 'Agent', agentId, {
      frozenSince: null,
      isActive: false,
    });
    await refresh(DAY_ONE_MIDNIGHT);

    expect(await eligibleMembersOf(free)).toEqual([]);
  });

  it('clears eligibility per contact when its lifecycle moves on', async () => {
    const country = `ZD-${randomUUID()}`;

    await setUpCampaign(country);

    const contact = await newContact(country);

    await refresh(DAY_ONE_MIDNIGHT);
    await updateRecord(client, 'Person', contact, {
      lifecycleStage: 'AWAITING_FIRST_CALL',
    });
    await recomputeContactEligibility(
      client,
      await loadEligibilityPlan(client, metadata),
      contact,
    );

    expect(await eligibleMembersOf(contact)).toEqual([]);
  });

  it('reports an invalid segment and grants nothing through it', async () => {
    const country = `ZE-${randomUUID()}`;
    const { segmentId } = await setUpCampaign(country);
    const person = await newContact(country);
    const badViewId = await createSegmentView([
      { fieldName: 'jobTitle', operand: 'CONTAINS', value: 'x' },
    ]);

    viewIds.push(badViewId);
    await updateRecord(client, 'Segment', segmentId, { viewId: badViewId });
    await refresh(DAY_ONE_MIDNIGHT);

    const [segment] = await listRecords<{ validationError: string | null }>(
      client,
      'segments',
      { id: { eq: segmentId } },
      { validationError: true },
    );

    expect(segment.validationError).toMatch(/cannot be used in a segment/);
    expect(await eligibleMembersOf(person)).toEqual([]);
  });

  it('computes eligibility the moment a contact is upserted', async () => {
    const country = `ZF-${randomUUID()}`;
    const platformUserId = `u_${randomUUID()}`;
    const eventId = randomUUID();

    await setUpCampaign(country);
    await refresh(DAY_ONE_MIDNIGHT);

    const event = {
      eventId,
      type: 'contact.upserted',
      schemaVersion: '1.0',
      occurredAt: '2026-11-14T06:30:00.000Z',
      data: {
        platformUserId,
        updatedAt: '2026-11-14T06:30:00.000Z',
        firstName: 'Ali',
        lastName: 'Rezaei',
        phone: null,
        email: null,
        signupAt: null,
        hasPhone: false,
        country,
        registrationSource: null,
        kycStatus: null,
        birthDate: null,
        activeAccountCount: 0,
        purchaseCount: 0,
        lastPurchaseAt: null,
        totalPaidUsdt: '0.00',
        currentStage: null,
        lastChallengeFailedAt: null,
        failedChallengeCount: 0,
        hasProfitWithdrawal: false,
        isReferred: false,
      },
    };
    await track(
      'PlatformEventInbox',
      createRecord(client, 'PlatformEventInbox', {
        eventId,
        eventType: event.type,
        platformUserId,
        occurredAt: event.occurredAt,
        payload: event,
        status: 'RECEIVED',
      }),
    );

    await runSweeper(new Date(), client);

    const [person] = await listRecords<{
      eligibleMemberIds: string[] | null;
      lifecycleStage: string;
    }>(
      client,
      'people',
      { platformUserId: { eq: platformUserId } },
      { eligibleMemberIds: true, lifecycleStage: true },
    );

    created.push({
      singular: 'Person',
      id: (person as unknown as { id: string }).id,
    });
    expect(person).toMatchObject({
      lifecycleStage: 'FREE',
      eligibleMemberIds: [memberId],
    });
  });
});
