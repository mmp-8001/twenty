import { CoreApiClient } from 'twenty-client-sdk/core';
import {
  defineLogicFunction,
  type DatabaseEventPayload,
  type ObjectRecordBaseEvent,
} from 'twenty-sdk/define';

import { PROOPCO_PAID_LOCK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  listRecords,
  updateRecord,
} from 'src/logic-functions/utils/list-records.util';

type CommissionSnapshot = Record<string, unknown> & {
  monthlyIncomeId?: string | null;
  updatedBy?: { source?: string };
};

// Row-level predicates cannot follow a relation, so the lock is enforced after the
// fact: an edit or delete of a Commission whose Monthly Income is Paid is undone.
export const guardPaidCommissionHandler = async (
  event: DatabaseEventPayload<ObjectRecordBaseEvent<CommissionSnapshot>>,
) => {
  const { before, after } = event.properties;

  // The app's own writes, this guard's reverts included, are never undone.
  if (!before?.monthlyIncomeId || after?.updatedBy?.source === 'APPLICATION') {
    return { reverted: false };
  }

  const client = new CoreApiClient({ runAs: 'application' });
  const [monthlyIncome] = await listRecords<{ payoutStatus: string }>(
    client,
    'monthlyIncomes',
    { id: { eq: before.monthlyIncomeId } },
    { payoutStatus: true },
  );

  if (monthlyIncome?.payoutStatus !== 'PAID') {
    return { reverted: false };
  }

  if (event.name === 'commission.deleted') {
    await client.mutation({
      restoreCommission: { __args: { id: event.recordId }, id: true },
    });
  } else {
    await updateRecord(
      client,
      'Commission',
      event.recordId,
      Object.fromEntries(
        (event.properties.updatedFields ?? []).map((field) => [
          field,
          before[field],
        ]),
      ),
    );
  }

  return { reverted: true };
};

export default defineLogicFunction({
  universalIdentifier: PROOPCO_PAID_LOCK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-guard-paid-commission',
  description: 'Undoes edits and deletes of Commissions in a Paid Monthly Income.',
  timeoutSeconds: 30,
  handler: guardPaidCommissionHandler,
  databaseEventTriggerSettings: { eventName: 'commission.*' },
});
