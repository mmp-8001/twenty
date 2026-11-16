import { MAX_ATTEMPTS, SWEEPER_BATCH_SIZE } from 'src/constants/platform-events.constant';
import {
  AUDIT_SELECTION,
  runAudit,
  type AuditContext,
  type AuditRow,
} from 'src/logic-functions/utils/audit-log.util';
import { FREEZE_EXECUTORS } from 'src/logic-functions/utils/freeze-agent.util';
import { INCOME_EXECUTORS } from 'src/logic-functions/utils/income-paid.util';
import { listRecords, updateRecord } from 'src/logic-functions/utils/records.util';
import { EXECUTORS_BY_ACTION } from 'src/logic-functions/utils/transfer-contacts.util';

// Long enough that an operation still running in its own request is never resumed under it.
export const RESUME_AFTER_MS = 2 * 60 * 1000;

const EXECUTORS = { ...EXECUTORS_BY_ACTION, ...FREEZE_EXECUTORS, ...INCOME_EXECUTORS };

// Step 7: finish operations that died halfway; five failed attempts end in Failed + needsReview.
export const resumeAudits = async (context: AuditContext, now: Date): Promise<number> => {
  const stuck = await listRecords<AuditRow & { lastError: string | null }>(
    context.client,
    'auditLogs',
    {
      and: [
        { status: { eq: 'IN_PROGRESS' } },
        { occurredAt: { lt: new Date(now.getTime() - RESUME_AFTER_MS).toISOString() } },
      ],
    },
    { ...AUDIT_SELECTION, lastError: true },
    SWEEPER_BATCH_SIZE,
  );
  let resumed = 0;

  for (const audit of stuck) {
    const executor = EXECUTORS[audit.action as keyof typeof EXECUTORS];

    if (executor === undefined) {
      continue;
    }

    if ((audit.attempts ?? 0) >= MAX_ATTEMPTS) {
      await updateRecord(context.client, 'AuditLog', audit.id, { status: 'FAILED', needsReview: true, lastError: audit.lastError || `Gave up after ${MAX_ATTEMPTS} attempts` });
      continue;
    }

    if ((await runAudit(context, audit, executor)).ok) {
      resumed += 1;
    }
  }

  return resumed;
};
