import { REASON_REQUIRED_MESSAGE } from 'src/constants/admin-management.constant';
import {
  createRecord,
  listRecords,
  type RecordsClient,
  updateRecord,
  updateRecordsWhere,
} from 'src/logic-functions/utils/list-records.util';
import { recomputeVisibility } from 'src/logic-functions/utils/recompute-visibility.util';
import { writeAuditLog } from 'src/logic-functions/utils/write-audit-log.util';
import { deadlineAfterRemaining, remainingSecondsUntil, shiftWindow } from 'src/utils/freeze-time.util';

export type ReassignMode = { type: 'TRANSFER'; toAdminId: string } | { type: 'RELEASE' };

export type ReassignUserResult = {
  personId: string;
  status: 'DONE' | 'SKIPPED' | 'ERROR';
  error?: string;
};

type MemberNode = { id: string; crmStatus: string | null; frozenSince: string | null };

type FollowupNode = {
  id: string;
  kind: string;
  status: string;
  campaignId: string | null;
  addedAt: string | null;
  firstAnsweredCallAt: string | null;
  deadlineAt: string | null;
  frozenRemainingSeconds: number | null;
};

type TouchNode = { touchNo: number; windowStartAt: string; windowEndAt: string; status: string };

const readMember = async (client: RecordsClient, id: string): Promise<MemberNode | null> =>
  (
    await listRecords<MemberNode>(client, 'workspaceMembers', { id: { eq: id } }, {
      crmStatus: true,
      frozenSince: true,
    })
  )[0] ?? null;

// The old case and Ownership close, the target gets new ones with the remaining time.
const reassignOne = async ({
  client,
  personId,
  mode,
  callerId,
  reason,
  now,
}: {
  client: RecordsClient;
  personId: string;
  mode: ReassignMode;
  callerId: string;
  reason: string;
  now: Date;
}): Promise<ReassignUserResult> => {
  const [ownership] = await listRecords<{ id: string; state: string; adminId: string | null }>(
    client,
    'ownerships',
    { openUserKey: { eq: personId } },
    { state: true, adminId: true },
  );

  if (!ownership) {
    return { personId, status: 'ERROR', error: 'This user is not owned by anyone' };
  }

  // A rerun finds the user already with the target and does nothing.
  if (mode.type === 'TRANSFER' && ownership.adminId === mode.toAdminId) {
    return { personId, status: 'SKIPPED' };
  }

  const [followup] = await listRecords<FollowupNode>(client, 'followups', { openKey: { eq: personId } }, {
    kind: true,
    status: true,
    campaignId: true,
    addedAt: true,
    firstAnsweredCallAt: true,
    deadlineAt: true,
    frozenRemainingSeconds: true,
  });
  const fromAdmin = ownership.adminId ? await readMember(client, ownership.adminId) : null;
  const claimed = await updateRecordsWhere(
    client,
    'ownerships',
    { id: { eq: ownership.id }, openUserKey: { eq: personId } },
    {
      endedAt: now.toISOString(),
      endReason: mode.type === 'TRANSFER' ? 'TRANSFERRED' : 'RELEASED_BY_MANAGER',
      openUserKey: null,
    },
  );

  if (claimed.length === 0) {
    return { personId, status: 'SKIPPED' };
  }

  try {
    const remainingSeconds = followup?.deadlineAt
      ? remainingSecondsUntil(new Date(followup.deadlineAt), now)
      : (followup?.frozenRemainingSeconds ?? null);
    const touches = followup
      ? await listRecords<TouchNode>(client, 'touches', { followupId: { eq: followup.id }, status: { eq: 'OPEN' } }, {
          touchNo: true,
          windowStartAt: true,
          windowEndAt: true,
          status: true,
        })
      : [];

    if (followup) {
      await updateRecordsWhere(client, 'followups', { id: { eq: followup.id } }, {
        status: mode.type === 'TRANSFER' ? 'TRANSFERRED' : 'RELEASED_BY_MANAGER',
        closedAt: now.toISOString(),
        openKey: null,
      });
    }

    if (mode.type === 'TRANSFER') {
      const newOwnershipId = await createRecord(client, 'Ownership', {
        personId,
        adminId: mode.toAdminId,
        state: ownership.state,
        startedAt: now.toISOString(),
        openUserKey: personId,
      });

      if (followup) {
        const newFollowupId = await createRecord(client, 'Followup', {
          personId,
          adminId: mode.toAdminId,
          ownershipId: newOwnershipId,
          campaignId: followup.campaignId,
          kind: followup.kind,
          status: followup.status,
          addedAt: followup.addedAt,
          firstAnsweredCallAt: followup.firstAnsweredCallAt,
          transferredFrom: followup.id,
          openKey: personId,
          ...(remainingSeconds === null ? {} : { deadlineAt: deadlineAfterRemaining(remainingSeconds, now).toISOString() }),
        });
        // Windows the old admin's freeze had stopped are shifted now.
        const shiftMs =
          fromAdmin?.crmStatus === 'FROZEN' && fromAdmin.frozenSince
            ? now.getTime() - new Date(fromAdmin.frozenSince).getTime()
            : 0;

        for (const touch of touches) {
          const window = shiftWindow({
            windowStartAt: new Date(touch.windowStartAt),
            windowEndAt: new Date(touch.windowEndAt),
            shiftMs,
          });

          await createRecord(client, 'Touch', {
            followupId: newFollowupId,
            adminId: mode.toAdminId,
            touchNo: touch.touchNo,
            windowStartAt: window.windowStartAt.toISOString(),
            windowEndAt: window.windowEndAt.toISOString(),
            status: 'OPEN',
          });
        }
      }

      // The new owner reads every earlier call and note.
      const calls = await listRecords<{ id: string; visibleToMemberIds: string[] | null }>(
        client,
        'calls',
        { personId: { eq: personId } },
        { visibleToMemberIds: true },
      );

      for (const call of calls) {
        await updateRecord(client, 'Call', call.id, {
          visibleToMemberIds: [...new Set([...(call.visibleToMemberIds ?? []), mode.toAdminId])],
        });
      }
    }

    await updateRecord(client, 'Person', personId, {
      currentOwnerId: mode.type === 'TRANSFER' ? mode.toAdminId : null,
    });
    await writeAuditLog({
      client,
      actorId: callerId,
      action: mode.type === 'TRANSFER' ? 'TRANSFER' : 'RELEASE_USER',
      subjectType: 'person',
      subjectId: personId,
      reason,
      payload: {
        fromAdminId: ownership.adminId,
        toAdminId: mode.type === 'TRANSFER' ? mode.toAdminId : null,
        remainingSeconds,
      },
    });

    return { personId, status: 'DONE' };
  } catch (error) {
    console.error(`Reassigning ${personId} stopped after its Ownership closed: ${String(error)}`);

    return { personId, status: 'ERROR', error: String(error) };
  }
};

export const reassignUsers = async ({
  client,
  callerId,
  mode,
  personIds,
  fromAdminId,
  reason,
  now = new Date(),
}: {
  client: RecordsClient;
  callerId: string;
  mode: ReassignMode;
  personIds?: string[];
  fromAdminId?: string;
  reason: string;
  now?: Date;
}): Promise<{ success: true; results: ReassignUserResult[] } | { success: false; error: string }> => {
  if (!reason.trim()) {
    return { success: false, error: REASON_REQUIRED_MESSAGE };
  }

  let ids = personIds;

  // "All users" of one admin.
  if (!ids || ids.length === 0) {
    if (!fromAdminId) {
      return { success: false, error: 'personIds or fromAdminId is required' };
    }

    ids = (
      await listRecords<{ personId: string | null }>(
        client,
        'ownerships',
        { adminId: { eq: fromAdminId }, openUserKey: { is: 'NOT_NULL' } },
        { personId: true },
      )
    )
      .map(({ personId }) => personId)
      .filter((personId): personId is string => Boolean(personId));
  }

  const target = mode.type === 'TRANSFER' ? await readMember(client, mode.toAdminId) : null;

  if (mode.type === 'TRANSFER' && (target?.crmStatus ?? 'ACTIVE') !== 'ACTIVE') {
    return { success: false, error: 'Users can only be transferred to an active admin' };
  }

  const results: ReassignUserResult[] = [];

  for (const personId of ids) {
    results.push(await reassignOne({ client, personId, mode, callerId, reason, now }));
  }

  await recomputeVisibility({
    client,
    now,
    personIds: results.filter(({ status }) => status === 'DONE').map(({ personId }) => personId),
  });

  return { success: true, results };
};
