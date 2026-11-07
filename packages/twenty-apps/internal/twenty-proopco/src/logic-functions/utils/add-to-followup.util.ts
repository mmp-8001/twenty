import { OWN_07_MESSAGE, USER_NOT_AVAILABLE_MESSAGE } from 'src/constants/ownership.constant';
import { INACTIVE_ADMIN_MESSAGE, isActiveMember } from 'src/logic-functions/utils/is-active-member.util';
import { pendingFirstCallDeadline } from 'src/logic-functions/utils/call-flow.util';
import {
  createRecord,
  listRecords,
  type RecordsClient,
  updateRecord,
} from 'src/logic-functions/utils/list-records.util';
import { recomputeVisibility } from 'src/logic-functions/utils/recompute-visibility.util';

type PersonNode = {
  currentOwnerId: string | null;
  permanentlyFailedAt: string | null;
  cooldownUntil: string | null;
  visibleToMemberIds: string[] | null;
  candidateCampaignIds: string[] | null;
};

export type AddToFollowupResult =
  | { success: true; ownershipId: string; followupId: string }
  | { success: false; error: string };

const openOwnershipExists = async (client: RecordsClient, personId: string) =>
  (await listRecords(client, 'ownerships', { openUserKey: { eq: personId } }, {})).length > 0;

// Campaign the Agent works this User through: the first candidate Campaign the Agent is assigned to.
const pickCampaignId = async (
  client: RecordsClient,
  memberId: string,
  candidateCampaignIds: string[],
): Promise<string | null> => {
  if (candidateCampaignIds.length === 0) {
    return null;
  }

  const assignments = await listRecords<{ campaignId: string | null }>(
    client,
    'campaignAdmins',
    { adminId: { eq: memberId }, removedAt: { is: 'NULL' } },
    { campaignId: true },
  );
  const assigned = new Set(assignments.map(({ campaignId }) => campaignId));

  return candidateCampaignIds.find((id) => assigned.has(id)) ?? null;
};

// Undoes a half-finished add. The app cannot delete, so the Ownership is closed and marked rolled back.
const rollBack = async (client: RecordsClient, ownershipId: string, now: Date) => {
  try {
    await updateRecord(client, 'Ownership', ownershipId, {
      endedAt: now.toISOString(),
      endReason: 'ROLLED_BACK',
      openUserKey: null,
    });
  } catch (error) {
    // The key stays held, so the User is stuck owned by nobody: surface it for a manual close.
    console.error(`Ownership ${ownershipId} could not be rolled back: ${String(error)}`);
  }
};

export const addToFollowup = async ({
  client,
  memberId,
  personId,
  now = new Date(),
}: {
  client: RecordsClient;
  memberId: string;
  personId: string;
  now?: Date;
}): Promise<AddToFollowupResult> => {
  if (!(await isActiveMember(client, memberId))) {
    return { success: false, error: INACTIVE_ADMIN_MESSAGE };
  }

  const [person] = await listRecords<PersonNode>(
    client,
    'people',
    { id: { eq: personId } },
    {
      currentOwnerId: true,
      permanentlyFailedAt: true,
      cooldownUntil: true,
      visibleToMemberIds: true,
      candidateCampaignIds: true,
    },
  );

  if (!person) {
    return { success: false, error: USER_NOT_AVAILABLE_MESSAGE };
  }

  if (person.currentOwnerId) {
    return { success: false, error: OWN_07_MESSAGE };
  }

  const isCoolingDown = person.cooldownUntil && new Date(person.cooldownUntil) > now;

  if (
    person.permanentlyFailedAt ||
    isCoolingDown ||
    !person.visibleToMemberIds?.includes(memberId)
  ) {
    return { success: false, error: USER_NOT_AVAILABLE_MESSAGE };
  }

  let ownershipId: string;

  // The unique open key decides a concurrent race: the loser's insert fails here.
  try {
    ownershipId = await createRecord(client, 'Ownership', {
      personId,
      adminId: memberId,
      state: 'PENDING_FIRST_CALL',
      startedAt: now.toISOString(),
      openUserKey: personId,
    });
  } catch (error) {
    if (await openOwnershipExists(client, personId)) {
      return { success: false, error: OWN_07_MESSAGE };
    }

    throw error;
  }

  try {
    const followupId = await createRecord(client, 'Followup', {
      personId,
      adminId: memberId,
      ownershipId,
      campaignId: await pickCampaignId(client, memberId, person.candidateCampaignIds ?? []),
      kind: 'CAMPAIGN',
      status: 'PENDING_FIRST_CALL',
      addedAt: now.toISOString(),
      deadlineAt: pendingFirstCallDeadline(now).toISOString(),
      openKey: personId,
    });

    await updateRecord(client, 'Person', personId, { currentOwnerId: memberId });
    await recomputeVisibility({ client, personIds: [personId], now });

    return { success: true, ownershipId, followupId };
  } catch (error) {
    await rollBack(client, ownershipId, now);

    throw error;
  }
};
