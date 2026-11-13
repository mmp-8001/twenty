import { isString } from '@sniptt/guards';
import { isNonEmptyArray } from 'twenty-shared/utils';
import { isDefined } from 'twenty-sdk/utils';

import {
  createAudit,
  loadAudit,
  runAudit,
  type AuditAction,
  type AuditContext,
  type AuditExecutor,
} from 'src/logic-functions/utils/audit-log.util';
import { type RefusalCode } from 'src/constants/refusal-codes.constant';
import { MAX_BULK_CONTACTS, type BulkCaller } from 'src/logic-functions/utils/transfer-contacts.util';
import { listRecords, updateRecordsWhere } from 'src/logic-functions/utils/records.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';

type IncomeResult = { succeeded: string[]; failed: { incomeId: string; code: RefusalCode; message: string }[] };

type Direction = { action: AuditAction; from: string; to: string; verb: string; refusal: { code: RefusalCode; message: string } };

const PAID: Direction = {
  action: 'INCOME_PAID',
  from: 'AWAITING_PAYMENT',
  to: 'PAID',
  verb: 'Paid',
  refusal: { code: 'ALREADY_PAID', message: 'This income is already paid.' },
};
const UNPAID: Direction = {
  action: 'INCOME_UNPAID',
  from: 'PAID',
  to: 'AWAITING_PAYMENT',
  verb: 'Unpaid',
  refusal: { code: 'NOT_PAID', message: 'This income is not paid.' },
};

// Absolute writes guarded by the old status: a resumed or repeated run writes the same thing.
const executorOf = (direction: Direction): AuditExecutor => async ({ client }, audit) => {
  const id = (audit.details as { monthlyIncomeId: string }).monthlyIncomeId;

  await updateRecordsWhere(
    client,
    'MonthlyIncomes',
    { and: [{ id: { eq: id } }, { status: { eq: direction.from } }] },
    direction.to === 'PAID'
      ? { status: 'PAID', paidAt: audit.effectiveAt, paidById: audit.actorId }
      : { status: 'AWAITING_PAYMENT', paidAt: null, paidById: null },
  );
};

const setPaid = async (
  context: AuditContext,
  direction: Direction,
  { caller, incomeIds, now }: { caller: BulkCaller; incomeIds: unknown; now: Date },
): Promise<IncomeResult> => {
  if (!isNonEmptyArray(incomeIds) || incomeIds.some((id) => !isString(id))) {
    throw new Refusal(400, 'INVALID_BODY', 'incomeIds is required');
  }

  if (incomeIds.length > MAX_BULK_CONTACTS) {
    throw new Refusal(400, 'TOO_MANY', `At most ${MAX_BULK_CONTACTS} at a time.`);
  }

  const result: IncomeResult = { succeeded: [], failed: [] };

  for (const incomeId of incomeIds as string[]) {
    const [income] = await listRecords<{ name: string; status: string; agentId: string | null }>(
      context.client,
      'monthlyIncomes',
      { id: { eq: incomeId } },
      { name: true, status: true, agentId: true },
      1,
    );

    if (!isDefined(income) || income.status !== direction.from) {
      result.failed.push({
        incomeId,
        code: isDefined(income) ? direction.refusal.code : 'NOT_FOUND',
        message: isDefined(income) ? direction.refusal.message : 'Income not found.',
      });
      continue;
    }

    const auditId = await createAudit(
      context.client,
      {
        name: `${direction.verb} · ${income.name}`,
        action: direction.action,
        actor: caller,
        effectiveAt: now,
        links: { monthlyIncomeId: incomeId, subjectAgentId: income.agentId },
        details: { monthlyIncomeId: incomeId },
      },
      'IN_PROGRESS',
    );
    const outcome = await runAudit(context, await loadAudit(context.client, auditId), executorOf(direction));

    if (outcome.ok) {
      result.succeeded.push(incomeId);
    } else {
      result.failed.push({ incomeId, code: 'OPERATION_FAILED', message: outcome.error });
    }
  }

  return result;
};

export const markIncomesPaid = (context: AuditContext, input: Parameters<typeof setPaid>[2]) => setPaid(context, PAID, input);
export const markIncomesUnpaid = (context: AuditContext, input: Parameters<typeof setPaid>[2]) => setPaid(context, UNPAID, input);
export const INCOME_EXECUTORS = { INCOME_PAID: executorOf(PAID), INCOME_UNPAID: executorOf(UNPAID) };
