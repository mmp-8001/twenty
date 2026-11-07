import { REBUY_NOT_AVAILABLE_MESSAGE } from 'src/constants/ownership.constant';
import {
  createRecord,
  listRecords,
  type RecordsClient,
  updateRecord,
} from 'src/logic-functions/utils/list-records.util';
import { readRebuySettings } from 'src/logic-functions/utils/rebuy-settings.util';
import { buildTouchWindows } from 'src/utils/call-windows.util';

const DAY_MS = 24 * 60 * 60 * 1000;

export type AddRebuyResult = { success: true } | { success: false; error: string };

// RB-03: the case goes straight to in progress; its deadline and call windows start at this click.
export const addRebuyToFollowup = async ({
  client,
  memberId,
  followupId,
  now = new Date(),
}: {
  client: RecordsClient;
  memberId: string;
  followupId: string;
  now?: Date;
}): Promise<AddRebuyResult> => {
  const [followup] = await listRecords<{
    kind: string | null;
    status: string | null;
    adminId: string | null;
    ownershipId: string | null;
    deadlineAt: string | null;
  }>(client, 'followups', { id: { eq: followupId } }, {
    kind: true,
    status: true,
    adminId: true,
    ownershipId: true,
    deadlineAt: true,
  });

  if (
    !followup ||
    followup.kind !== 'REBUY' ||
    followup.status !== 'REBUY_PENDING' ||
    followup.adminId !== memberId ||
    (followup.deadlineAt && new Date(followup.deadlineAt) <= now)
  ) {
    return { success: false, error: REBUY_NOT_AVAILABLE_MESSAGE };
  }

  // Conditional on the status, so a double click or a racing purchase leaves exactly one winner.
  const claimed = (await client.mutation({
    updateFollowups: {
      __args: {
        filter: { id: { eq: followupId }, status: { eq: 'REBUY_PENDING' } },
        data: {
          status: 'IN_PROGRESS',
          firstAnsweredCallAt: now.toISOString(),
          deadlineAt: new Date(now.getTime() + readRebuySettings().followupDays * DAY_MS).toISOString(),
        },
      },
      id: true,
    },
  } as never)) as unknown as { updateFollowups?: { id: string }[] };

  if (!claimed.updateFollowups?.length) {
    return { success: false, error: REBUY_NOT_AVAILABLE_MESSAGE };
  }

  if (followup.ownershipId) {
    await updateRecord(client, 'Ownership', followup.ownershipId, { state: 'IN_FOLLOWUP' });
  }

  for (const { touchNo, windowStartAt, windowEndAt } of buildTouchWindows(now)) {
    await createRecord(client, 'Touch', {
      followupId,
      adminId: memberId,
      touchNo,
      windowStartAt: windowStartAt.toISOString(),
      windowEndAt: windowEndAt.toISOString(),
      status: 'OPEN',
    });
  }

  return { success: true };
};
