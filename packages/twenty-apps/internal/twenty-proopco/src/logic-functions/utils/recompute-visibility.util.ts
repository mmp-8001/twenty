import { CoreApiClient } from 'twenty-client-sdk/core';

import {
  computeUserAudience,
  isCampaignActive,
} from 'src/logic-functions/utils/compute-user-audience.util';
import { isSameValue } from 'src/logic-functions/utils/is-same-fields.util';
import {
  listRecords,
  type RecordsClient,
  updateRecord,
} from 'src/logic-functions/utils/list-records.util';
import { readSegmentFilter } from 'src/logic-functions/utils/read-segment-filter.util';

type CampaignNode = {
  id: string;
  name: string | null;
  status: string | null;
  startsAt: string | null;
  endsAt: string | null;
  segmentViewId: string | null;
  availableUserCount: number | null;
};

type PersonNode = {
  id: string;
  currentOwnerId: string | null;
  permanentlyFailedAt: string | null;
  cooldownUntil: string | null;
  visibleToMemberIds: string[] | null;
  candidateCampaignIds: string[] | null;
};

const PERSON_SELECTION = {
  currentOwnerId: true,
  permanentlyFailedAt: true,
  cooldownUntil: true,
  visibleToMemberIds: true,
  candidateCampaignIds: true,
};

const toUserIds = (nodes: { id: string }[]) => new Set(nodes.map(({ id }) => id));

// Rewrites the ADR 0008 lists. With personIds only those Users are recomputed;
// otherwise every User is, and each Campaign's available count is refreshed.
export const recomputeVisibility = async ({
  client,
  now = new Date(),
  personIds,
}: {
  client: RecordsClient;
  now?: Date;
  personIds?: string[];
}): Promise<{ updatedPeople: number }> => {
  if (personIds?.length === 0) {
    return { updatedPeople: 0 };
  }

  const campaigns = await listRecords<CampaignNode>(client, 'campaigns', {}, {
    name: true,
    status: true,
    startsAt: true,
    endsAt: true,
    segmentViewId: true,
    availableUserCount: true,
  });
  const activeCampaigns = campaigns.filter((campaign) =>
    isCampaignActive(campaign, now),
  );
  const assignments = await listRecords<{ campaignId: string | null; adminId: string | null }>(
    client,
    'campaignAdmins',
    { removedAt: { is: 'NULL' } },
    { campaignId: true, adminId: true },
  );
  const adminIdsByCampaignId: Record<string, string[]> = {};

  for (const { campaignId, adminId } of assignments) {
    if (campaignId && adminId) {
      (adminIdsByCampaignId[campaignId] ??= []).push(adminId);
    }
  }

  const idScope = personIds ? [{ id: { in: personIds } }] : [];
  const matchingPeopleByCampaignId: Record<string, Set<string>> = {};

  for (const campaign of activeCampaigns) {
    try {
      const segmentFilter = await readSegmentFilter(campaign.segmentViewId ?? '', now);

      matchingPeopleByCampaignId[campaign.id] = toUserIds(
        await listRecords<{ id: string }>(
          client,
          'people',
          { and: [segmentFilter, ...idScope] },
          {},
        ),
      );
    } catch (error) {
      // A broken Segment must not stop the other Campaigns; its Users just drop out.
      console.error(`Campaign ${campaign.id} segment skipped: ${String(error)}`);
      matchingPeopleByCampaignId[campaign.id] = new Set();
    }
  }

  const people = await listRecords<PersonNode>(
    client,
    'people',
    personIds ? { id: { in: personIds } } : {},
    PERSON_SELECTION,
  );
  const availableCountByCampaignId: Record<string, number> = {};
  let updatedPeople = 0;

  for (const person of people) {
    const audience = computeUserAudience({
      person: {
        currentOwnerId: person.currentOwnerId ?? null,
        permanentlyFailedAt: person.permanentlyFailedAt ?? null,
        cooldownUntil: person.cooldownUntil ?? null,
      },
      activeCampaignIdsMatchingUser: activeCampaigns
        .filter(({ id }) => matchingPeopleByCampaignId[id]?.has(person.id))
        .map(({ id }) => id),
      adminIdsByCampaignId,
      now,
    });

    for (const campaignId of audience.candidateCampaignIds) {
      availableCountByCampaignId[campaignId] =
        (availableCountByCampaignId[campaignId] ?? 0) + 1;
    }

    if (
      !isSameValue(audience.visibleToMemberIds, person.visibleToMemberIds ?? []) ||
      !isSameValue(audience.candidateCampaignIds, person.candidateCampaignIds ?? [])
    ) {
      await updateRecord(client, 'Person', person.id, audience);
      updatedPeople += 1;
    }
  }

  if (!personIds) {
    for (const campaign of campaigns) {
      const count = availableCountByCampaignId[campaign.id] ?? 0;

      if (campaign.availableUserCount !== count) {
        await updateRecord(client, 'Campaign', campaign.id, { availableUserCount: count });
      }
    }
  }

  return { updatedPeople };
};

export const recomputeAllVisibility = (referenceDate?: string) =>
  recomputeVisibility({
    client: new CoreApiClient({ runAs: 'application' }),
    now: new Date(referenceDate ?? Date.now()),
  });
