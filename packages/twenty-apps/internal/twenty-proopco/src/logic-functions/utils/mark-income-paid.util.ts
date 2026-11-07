import { NOT_ALLOWED_MESSAGE } from 'src/constants/admin-management.constant';
import { INCOME_NOT_AVAILABLE_MESSAGE } from 'src/constants/income-report.constant';
import { type RecordsClient, updateRecordsWhere } from 'src/logic-functions/utils/list-records.util';
import { writeAuditLog } from 'src/logic-functions/utils/write-audit-log.util';
import { type AdminRoleKey } from 'src/utils/admin-permissions.util';

// Only the Full Admin marks an income paid; the conditional update makes a second click a no-op.
export const markIncomePaid = async ({
  client,
  callerId,
  callerRole,
  incomeId,
  now = new Date(),
}: {
  client: RecordsClient;
  callerId: string;
  callerRole: AdminRoleKey | null;
  incomeId: string;
  now?: Date;
}): Promise<{ success: true } | { success: false; error: string }> => {
  if (callerRole !== 'FULL_ADMIN') {
    return { success: false, error: NOT_ALLOWED_MESSAGE };
  }

  const claimed = await updateRecordsWhere(
    client,
    'monthlyIncomes',
    { id: { eq: incomeId }, status: { eq: 'PENDING' } },
    { status: 'PAID', paidAt: now.toISOString(), paidById: callerId },
  );

  if (claimed.length === 0) {
    return { success: false, error: INCOME_NOT_AVAILABLE_MESSAGE };
  }

  await writeAuditLog({
    client,
    actorId: callerId,
    action: 'INCOME_PAID',
    subjectType: 'monthlyIncome',
    subjectId: incomeId,
  });

  return { success: true };
};
