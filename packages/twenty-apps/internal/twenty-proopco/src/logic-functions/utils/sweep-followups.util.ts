import { CoreApiClient } from 'twenty-client-sdk/core';

import { planFollowupSweep } from 'src/logic-functions/utils/plan-followup-sweep.util';
import {
  listRecords,
  type RecordsClient,
  updateRecord,
} from 'src/logic-functions/utils/list-records.util';
import { readRebuySettings } from 'src/logic-functions/utils/rebuy-settings.util';
import { recomputeVisibility } from 'src/logic-functions/utils/recompute-visibility.util';

const HOUR_MS = 60 * 60 * 1000;

type DueFollowup = {
  id: string;
  status: string | null;
  deadlineAt: string | null;
  personId: string | null;
  ownershipId: string | null;
  campaignId: string | null;
  kind: string | null;
};

// shortcut: only cooldowns that ended within the last hour are refreshed here; the hourly recompute catches the rest.
const COOLDOWN_REFRESH_LOOKBACK_MS = HOUR_MS;

// A conditional update: the winner is the call whose filter still matched, so overlapping sweeps never both close a case.
const claimFollowup = async (
  client: RecordsClient,
  followup: DueFollowup,
  data: Record<string, unknown>,
): Promise<boolean> => {
  const result = (await client.mutation({
    updateFollowups: {
      __args: {
        filter: { id: { eq: followup.id }, status: { eq: followup.status } },
        data,
      },
      id: true,
    },
  } as never)) as unknown as { updateFollowups?: { id: string }[] };

  return (result.updateFollowups?.length ?? 0) > 0;
};

export const sweepFollowups = async ({
  client,
  now = new Date(),
}: {
  client: RecordsClient;
  now?: Date;
}) => {
  const campaigns = await listRecords<{ id: string; cooldownDays: number | null }>(client, 'campaigns', {}, {
    cooldownDays: true,
  });
  const cooldownDaysByCampaignId = new Map(
    campaigns.map(({ id, cooldownDays }) => [id, cooldownDays ?? 0]),
  );
  // A frozen Admin's cases have no deadline, so the lte filter leaves them alone.
  const dueFollowups = await listRecords<DueFollowup>(
    client,
    'followups',
    {
      status: { in: ['PENDING_FIRST_CALL', 'IN_PROGRESS', 'REBUY_PENDING'] },
      deadlineAt: { lte: now.toISOString() },
    },
    { status: true, deadlineAt: true, personId: true, ownershipId: true, campaignId: true, kind: true },
  );
  const releasedPersonIds: string[] = [];
  let closedFollowups = 0;

  for (const followup of dueFollowups) {
    const plan = planFollowupSweep({
      status: followup.status,
      deadlineAt: followup.deadlineAt,
      // RB-04: a rebuy case has no Campaign, so it cools down with the global value.
      cooldownDays:
        followup.kind === 'REBUY'
          ? readRebuySettings().cooldownDays
          : (cooldownDaysByCampaignId.get(followup.campaignId ?? '') ?? 0),
      now,
    });

    if (!plan || !(await claimFollowup(client, followup, plan.followup))) {
      continue;
    }

    closedFollowups += 1;

    try {
      if (followup.ownershipId) {
        await updateRecord(client, 'Ownership', followup.ownershipId, plan.ownership);
      }

      if (followup.personId) {
        await updateRecord(client, 'Person', followup.personId, plan.person);
        releasedPersonIds.push(followup.personId);
      }
    } catch (error) {
      console.error(`Followup ${followup.id} closed but its Ownership or User update failed: ${String(error)}`);
    }
  }

  const missedTouches = (await client.mutation({
    updateTouches: {
      __args: {
        filter: { status: { eq: 'OPEN' }, windowEndAt: { lte: now.toISOString() } },
        data: { status: 'MISSED' },
      },
      id: true,
    },
  } as never)) as unknown as { updateTouches?: { id: string }[] };

  const cooledDown = await listRecords<{ id: string }>(
    client,
    'people',
    {
      and: [
        { cooldownUntil: { lte: now.toISOString() } },
        { cooldownUntil: { gt: new Date(now.getTime() - COOLDOWN_REFRESH_LOOKBACK_MS).toISOString() } },
        { currentOwnerId: { is: 'NULL' } },
      ],
    },
    {},
  );

  await recomputeVisibility({
    client,
    now,
    personIds: [...new Set([...releasedPersonIds, ...cooledDown.map(({ id }) => id)])],
  });

  return {
    closedFollowups,
    missedTouches: missedTouches.updateTouches?.length ?? 0,
    refreshedPeople: cooledDown.length,
  };
};

export const sweepFollowupsWithApplicationClient = (referenceDate?: string) =>
  sweepFollowups({
    client: new CoreApiClient({ runAs: 'application' }),
    now: new Date(referenceDate ?? Date.now()),
  });
