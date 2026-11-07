import {
  NOT_ALLOWED_MESSAGE,
  REASON_REQUIRED_MESSAGE,
} from 'src/constants/admin-management.constant';
import {
  createRecord,
  listRecords,
  type RecordsClient,
  updateRecord,
  updateRecordsWhere,
} from 'src/logic-functions/utils/list-records.util';
import { writeAuditLog } from 'src/logic-functions/utils/write-audit-log.util';
import { type AdminRoleKey, canFreeze } from 'src/utils/admin-permissions.util';
import {
  deadlineAfterRemaining,
  remainingSecondsUntil,
  shiftWindow,
} from 'src/utils/freeze-time.util';

export type AdminActionResult = { success: true } | { success: false; error: string };

const OPEN_CASE_STATUSES = ['PENDING_FIRST_CALL', 'IN_PROGRESS', 'REBUY_PENDING'];

type Actor = {
  client: RecordsClient;
  callerId: string;
  callerRole: AdminRoleKey | null;
  targetId: string;
  targetRole: AdminRoleKey | null;
  now?: Date;
};

const fail = (error: string): AdminActionResult => ({ success: false, error });

// Every open case keeps its remaining time and loses its deadline.
export const freezeAdmin = async ({
  client,
  callerId,
  callerRole,
  targetId,
  targetRole,
  reason,
  now = new Date(),
}: Actor & { reason: string }): Promise<AdminActionResult> => {
  if (!reason.trim()) {
    return fail(REASON_REQUIRED_MESSAGE);
  }

  if (!canFreeze({ callerId, callerRole, targetId, targetRole })) {
    return fail(NOT_ALLOWED_MESSAGE);
  }

  // Bulk updates on workspace members are refused to the app, so this is a read and a single update.
  const [member] = await listRecords<{ crmStatus: string | null }>(
    client,
    'workspaceMembers',
    { id: { eq: targetId } },
    { crmStatus: true },
  );

  if (!member || (member.crmStatus ?? 'ACTIVE') !== 'ACTIVE') {
    return fail('This agent is not active');
  }

  await updateRecord(client, 'WorkspaceMember', targetId, {
    crmStatus: 'FROZEN',
    frozenSince: now.toISOString(),
  });

  await createRecord(client, 'AdminFreeze', {
    adminId: targetId,
    reason,
    frozenAt: now.toISOString(),
    frozenById: callerId,
  });

  const cases = await listRecords<{ id: string; deadlineAt: string | null }>(
    client,
    'followups',
    { adminId: { eq: targetId }, status: { in: OPEN_CASE_STATUSES }, deadlineAt: { is: 'NOT_NULL' } },
    { deadlineAt: true },
  );

  for (const { id, deadlineAt } of cases) {
    await updateRecordsWhere(
      client,
      'followups',
      { id: { eq: id }, deadlineAt: { is: 'NOT_NULL' } },
      {
        frozenRemainingSeconds: remainingSecondsUntil(new Date(deadlineAt as string), now),
        deadlineAt: null,
      },
    );
  }

  await writeAuditLog({
    client,
    actorId: callerId,
    action: 'FREEZE',
    subjectType: 'workspaceMember',
    subjectId: targetId,
    reason,
    payload: { frozenCases: cases.length },
  });

  return { success: true };
};

// Deadlines restart from what was left, open call windows move by the frozen time.
export const unfreezeAdmin = async ({
  client,
  callerId,
  callerRole,
  targetId,
  targetRole,
  reason = null,
  now = new Date(),
}: Actor & { reason?: string | null }): Promise<AdminActionResult> => {
  if (!canFreeze({ callerId, callerRole, targetId, targetRole })) {
    return fail(NOT_ALLOWED_MESSAGE);
  }

  const [freeze] = await listRecords<{ id: string; frozenAt: string }>(
    client,
    'adminFreezes',
    { adminId: { eq: targetId }, unfrozenAt: { is: 'NULL' } },
    { frozenAt: true },
  );

  if (!freeze) {
    return fail('This agent is not frozen');
  }

  const shiftMs = now.getTime() - new Date(freeze.frozenAt).getTime();
  const cases = await listRecords<{ id: string; frozenRemainingSeconds: number }>(
    client,
    'followups',
    { adminId: { eq: targetId }, status: { in: OPEN_CASE_STATUSES }, frozenRemainingSeconds: { is: 'NOT_NULL' } },
    { frozenRemainingSeconds: true },
  );

  for (const { id, frozenRemainingSeconds } of cases) {
    const restored = await updateRecordsWhere(
      client,
      'followups',
      { id: { eq: id }, frozenRemainingSeconds: { is: 'NOT_NULL' } },
      {
        deadlineAt: deadlineAfterRemaining(frozenRemainingSeconds, now).toISOString(),
        frozenRemainingSeconds: null,
      },
    );

    if (restored.length === 0) {
      continue;
    }

    const touches = await listRecords<{ id: string; windowStartAt: string; windowEndAt: string }>(
      client,
      'touches',
      { followupId: { eq: id }, status: { eq: 'OPEN' } },
      { windowStartAt: true, windowEndAt: true },
    );

    for (const touch of touches) {
      const shifted = shiftWindow({
        windowStartAt: new Date(touch.windowStartAt),
        windowEndAt: new Date(touch.windowEndAt),
        shiftMs,
      });

      await updateRecord(client, 'Touch', touch.id, {
        windowStartAt: shifted.windowStartAt.toISOString(),
        windowEndAt: shifted.windowEndAt.toISOString(),
      });
    }
  }

  // The freeze closes and the member reactivates last: a failure above leaves the freeze open, so a retry
  // resumes the restore, and the sweep keeps skipping this agent's windows until they are shifted.
  await updateRecordsWhere(
    client,
    'adminFreezes',
    { id: { eq: freeze.id }, unfrozenAt: { is: 'NULL' } },
    { unfrozenAt: now.toISOString(), unfrozenById: callerId },
  );
  await updateRecord(client, 'WorkspaceMember', targetId, { crmStatus: 'ACTIVE', frozenSince: null });
  await writeAuditLog({
    client,
    actorId: callerId,
    action: 'UNFREEZE',
    subjectType: 'workspaceMember',
    subjectId: targetId,
    reason,
    payload: { restoredCases: cases.length, shiftSeconds: Math.floor(shiftMs / 1000) },
  });

  return { success: true };
};
