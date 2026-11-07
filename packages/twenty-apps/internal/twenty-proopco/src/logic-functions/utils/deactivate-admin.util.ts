import {
  NOT_ALLOWED_MESSAGE,
  REASON_REQUIRED_MESSAGE,
} from 'src/constants/admin-management.constant';
import { type AdminActionResult } from 'src/logic-functions/utils/freeze-admin.util';
import {
  listRecords,
  type RecordsClient,
  updateRecord,
  updateRecordsWhere,
} from 'src/logic-functions/utils/list-records.util';
import { writeAuditLog } from 'src/logic-functions/utils/write-audit-log.util';
import { type AdminRoleKey, canDeactivate } from 'src/utils/admin-permissions.util';

export const OWNS_USERS_MESSAGE = 'This admin still owns users: transfer or release them first';

// Invariant 9: an Admin is deactivated only when they own no users.
export const deactivateAdmin = async ({
  client,
  callerId,
  callerRole,
  targetId,
  reason,
  now = new Date(),
}: {
  client: RecordsClient;
  callerId: string;
  callerRole: AdminRoleKey | null;
  targetId: string;
  reason: string;
  now?: Date;
}): Promise<AdminActionResult> => {
  if (!reason.trim()) {
    return { success: false, error: REASON_REQUIRED_MESSAGE };
  }

  if (!canDeactivate({ callerId, callerRole, targetId })) {
    return { success: false, error: NOT_ALLOWED_MESSAGE };
  }

  const owned = await listRecords(client, 'ownerships', {
    adminId: { eq: targetId },
    openUserKey: { is: 'NOT_NULL' },
  }, {});

  if (owned.length > 0) {
    return { success: false, error: OWNS_USERS_MESSAGE };
  }

  const [member] = await listRecords<{ crmStatus: string | null }>(
    client,
    'workspaceMembers',
    { id: { eq: targetId } },
    { crmStatus: true },
  );

  if (!member || member.crmStatus === 'DEACTIVATED') {
    return { success: false, error: 'This admin is already deactivated' };
  }

  // A removed assignment drops the admin from the campaign's visibility through the recompute trigger.
  await updateRecordsWhere(client, 'campaignAdmins', { adminId: { eq: targetId }, removedAt: { is: 'NULL' } }, {
    removedAt: now.toISOString(),
  });

  // Bulk updates on workspace members are refused to the app.
  await updateRecord(client, 'WorkspaceMember', targetId, { crmStatus: 'DEACTIVATED' });

  await writeAuditLog({
    client,
    actorId: callerId,
    action: 'DEACTIVATE_ADMIN',
    subjectType: 'workspaceMember',
    subjectId: targetId,
    reason,
  });

  return { success: true };
};
