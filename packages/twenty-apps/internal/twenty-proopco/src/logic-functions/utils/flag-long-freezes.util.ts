import { LONG_FREEZE_DAYS } from 'src/constants/admin-management.constant';
import {
  listRecords,
  type RecordsClient,
  updateRecordsWhere,
} from 'src/logic-functions/utils/list-records.util';
import { writeAuditLog } from 'src/logic-functions/utils/write-audit-log.util';
import { DAY_MS } from 'src/constants/time.constant';

// A freeze open for LONG_FREEZE_DAYS is flagged once, in its warnedAt and the audit log.
export const flagLongFreezes = async ({
  client,
  now = new Date(),
}: {
  client: RecordsClient;
  now?: Date;
}): Promise<{ flagged: number }> => {
  const due = await listRecords<{ id: string; adminId: string | null }>(
    client,
    'adminFreezes',
    {
      unfrozenAt: { is: 'NULL' },
      warnedAt: { is: 'NULL' },
      frozenAt: { lte: new Date(now.getTime() - LONG_FREEZE_DAYS * DAY_MS).toISOString() },
    },
    { adminId: true },
  );
  let flagged = 0;

  for (const freeze of due) {
    const claimed = await updateRecordsWhere(
      client,
      'adminFreezes',
      { id: { eq: freeze.id }, warnedAt: { is: 'NULL' } },
      { warnedAt: now.toISOString() },
    );

    if (claimed.length > 0) {
      flagged += 1;
      await writeAuditLog({
        client,
        actorId: null,
        action: 'LONG_FREEZE_WARNING',
        subjectType: 'workspaceMember',
        subjectId: freeze.adminId ?? freeze.id,
        payload: { freezeId: freeze.id, days: LONG_FREEZE_DAYS },
      });
    }
  }

  return { flagged };
};
