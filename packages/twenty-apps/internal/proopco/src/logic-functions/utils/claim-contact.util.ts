import { isDefined } from 'twenty-sdk/utils';
import { type MetadataApiClient } from 'twenty-client-sdk/metadata';

import { DAY_MS, AWAITING_FIRST_CALL_DAYS } from 'src/constants/time.constant';
import { type AgentActor } from 'src/logic-functions/utils/agent-actor.util';
import { personDisplayName } from 'src/logic-functions/utils/call-context.util';
import {
  clockOfDeal,
  dealClockFields,
  loadOpenDeal,
  personMirrorFields,
} from 'src/logic-functions/utils/deal.util';
import {
  loadEligibilityPlan,
  recomputeContactEligibility,
  type EligibilityPlan,
} from 'src/logic-functions/utils/eligibility.util';
import { recountOwnedContacts } from 'src/logic-functions/utils/recount-owned-contacts.util';
import {
  createRecord,
  listRecords,
  updateRecord,
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';
import { type DealClock } from 'src/utils/deal-clock.util';

const DEAL_CREATE_ATTEMPTS = 3;
const LOST_RACE_MESSAGE = "This user is in another agent's follow-ups.";

type PersonRow = {
  name: { firstName: string; lastName: string } | null;
  lifecycleStage: string;
  ownerId: string | null;
  eligibleMemberIds: string[] | null;
};

export type ClaimResult = {
  dealId: string;
  campaignName: string | null;
  kind: 'CAMPAIGN' | 'REBUY';
};

// Earliest startsAt among the agent's Active campaigns that match the contact; ties go to the older campaign.
const pickSourceCampaign = async (
  client: RecordsClient,
  plan: EligibilityPlan,
  memberId: string,
  personId: string,
) => {
  const candidates = [];

  for (const entry of plan.filter(({ memberIds }) => memberIds.includes(memberId))) {
    const matches = await listRecords<{ id: string }>(
      client,
      'people',
      { and: [{ id: { eq: personId } }, { or: entry.segmentFilters }] },
      {},
      1,
    );

    if (matches.length > 0) {
      candidates.push(entry);
    }
  }

  candidates.sort(
    (left, right) =>
      left.startsAt.localeCompare(right.startsAt) ||
      left.createdAt.localeCompare(right.createdAt),
  );

  return candidates[0] ?? null;
};

const createDealWithRetry = async (
  client: RecordsClient,
  data: Record<string, unknown>,
  personId: string,
): Promise<string> => {
  let lastError: unknown;

  for (let attempt = 0; attempt < DEAL_CREATE_ATTEMPTS; attempt += 1) {
    try {
      return await createRecord(client, 'Opportunity', data);
    } catch (error) {
      lastError = error;

      // A duplicate open-deal key means an earlier attempt landed.
      const [landed] = await listRecords<{ id: string }>(
        client,
        'opportunities',
        { openDealKey: { eq: personId } },
        {},
        1,
      );

      if (isDefined(landed)) {
        return landed.id;
      }
    }
  }

  throw lastError;
};

const releaseClaim = async (
  client: RecordsClient,
  plan: EligibilityPlan,
  actor: AgentActor,
  personId: string,
) => {
  await updateRecordsWhere(
    client,
    'People',
    { and: [{ id: { eq: personId } }, { ownerId: { eq: actor.agentId } }] },
    {
      ownerId: null,
      ownerMemberId: null,
      lifecycleStage: 'FREE',
      ownedSince: null,
      sourceCampaignId: null,
    },
  );
  await recomputeContactEligibility(client, plan, personId);
  await recountOwnedContacts(client, actor.agentId);
};

const claimRebuy = async (
  client: RecordsClient,
  actor: AgentActor,
  personId: string,
  now: Date,
): Promise<ClaimResult> => {
  const deal = await loadOpenDeal(client, personId);

  if (!isDefined(deal) || deal.dealStage !== 'REBUY_WINDOW') {
    throw new Refusal(409, 'NO_OPEN_DEAL', 'This contact has no open rebuy deal.');
  }

  const [settings] = await listRecords<{ rebuyFollowUpDays: number }>(
    client,
    'proopcoSettingsRecords',
    {},
    { rebuyFollowUpDays: true },
    1,
  );
  const deadlineAt = new Date(
    now.getTime() + (settings?.rebuyFollowUpDays ?? 30) * DAY_MS + (deal.frozenMs ?? 0),
  );
  const clock: DealClock = {
    ...clockOfDeal(deal),
    stage: 'IN_FOLLOW_UP',
    deadlineAt,
  };
  const moved = await updateRecordsWhere(
    client,
    'Opportunities',
    {
      and: [
        { id: { eq: deal.id } },
        { dealStage: { eq: 'REBUY_WINDOW' } },
        { deadlineAt: { eq: deal.deadlineAt } },
      ],
    },
    dealClockFields(clock, null),
  );

  if (moved.length === 0) {
    throw new Refusal(409, 'FOLLOW_UP_ENDED', 'This follow-up has ended.');
  }

  await updateRecord(client, 'Person', personId, {
    lifecycleStage: 'IN_FOLLOW_UP',
    ...personMirrorFields({ clock, dealTypeLabel: 'Rebuy', nextCallAt: null, now }),
  });

  return { dealId: deal.id, campaignName: null, kind: 'REBUY' };
};

export const claimContact = async ({
  client,
  metadata,
  actor,
  personId,
  now,
}: {
  client: RecordsClient;
  metadata: MetadataApiClient;
  actor: AgentActor;
  personId: string;
  now: Date;
}): Promise<ClaimResult> => {
  const [person] = await listRecords<PersonRow>(
    client,
    'people',
    { and: [{ id: { eq: personId } }, { deletedAt: { is: 'NULL' } }] },
    { name: { firstName: true, lastName: true }, lifecycleStage: true, ownerId: true, eligibleMemberIds: true },
    1,
  );

  if (!isDefined(person)) {
    throw new Refusal(404, 'CONTACT_NOT_FOUND', 'Contact not found.');
  }

  if (person.lifecycleStage === 'REBUY_WINDOW' && person.ownerId === actor.agentId) {
    return claimRebuy(client, actor, personId, now);
  }

  if (person.lifecycleStage !== 'FREE' || isDefined(person.ownerId)) {
    throw new Refusal(409, 'CLAIM_LOST', LOST_RACE_MESSAGE);
  }

  if (!(person.eligibleMemberIds ?? []).includes(actor.memberId)) {
    throw new Refusal(403, 'NOT_ELIGIBLE', 'This contact is not in your lists.');
  }

  const plan = await loadEligibilityPlan(client, metadata);
  const campaign = await pickSourceCampaign(client, plan, actor.memberId, personId);

  if (!isDefined(campaign)) {
    throw new Refusal(403, 'NOT_ELIGIBLE', 'This contact is not in your lists.');
  }

  const won = await updateRecordsWhere(
    client,
    'People',
    {
      and: [
        { id: { eq: personId } },
        { ownerId: { is: 'NULL' } },
        { deletedAt: { is: 'NULL' } },
        { lifecycleStage: { eq: 'FREE' } },
      ],
    },
    {
      ownerId: actor.agentId,
      ownerMemberId: actor.memberId,
      lifecycleStage: 'AWAITING_FIRST_CALL',
      eligibleMemberIds: [],
      ownedSince: now.toISOString(),
      sourceCampaignId: campaign.campaignId,
    },
  );

  if (won.length === 0) {
    throw new Refusal(409, 'CLAIM_LOST', LOST_RACE_MESSAGE);
  }

  const [campaignRow] = await listRecords<{ name: string }>(
    client,
    'campaigns',
    { id: { eq: campaign.campaignId } },
    { name: true },
    1,
  );
  const deadlineAt = new Date(now.getTime() + AWAITING_FIRST_CALL_DAYS * DAY_MS);
  let dealId: string;

  try {
    dealId = await createDealWithRetry(
      client,
      {
        name: `${personDisplayName(person.name)} · ${campaignRow?.name ?? ''}`,
        pointOfContactId: personId,
        dealType: 'CAMPAIGN',
        dealStage: 'AWAITING_FIRST_CALL',
        openDealKey: personId,
        openedAt: now.toISOString(),
        deadlineAt: deadlineAt.toISOString(),
        agentId: actor.agentId,
        agentMemberId: actor.memberId,
        contactOwnerId: actor.agentId,
        contactOwnerMemberId: actor.memberId,
        sourceCampaignId: campaign.campaignId,
      },
      personId,
    );
  } catch {
    await releaseClaim(client, plan, actor, personId);

    throw new Refusal(503, 'CLAIM_FAILED', 'Could not add this contact. Try again.');
  }

  const clock: DealClock = {
    stage: 'AWAITING_FIRST_CALL',
    openedAt: now,
    firstAnsweredCallAt: null,
    frozenMs: 0,
    deadlineAt,
    slots: ['PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING'],
  };

  await updateRecord(client, 'Person', personId, personMirrorFields({
    clock,
    dealTypeLabel: 'Campaign',
    sourceCampaignId: campaign.campaignId,
    nextCallAt: null,
    now,
  }));
  await recountOwnedContacts(client, actor.agentId);

  return { dealId, campaignName: campaignRow?.name ?? null, kind: 'CAMPAIGN' };
};
