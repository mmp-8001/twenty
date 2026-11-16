import {
  OPEN_DEAL_STAGES,
} from 'src/logic-functions/utils/deal.util';
import {
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

// Conditional on the deal still being open with the deadline we read; false means someone else closed or moved it.
export const closeDeal = async (
  client: RecordsClient,
  deal: { id: string; deadlineAt: string },
  data: Record<string, unknown>,
  now: Date,
): Promise<boolean> =>
  (
    await updateRecordsWhere(
      client,
      'Opportunities',
      {
        and: [
          { id: { eq: deal.id } },
          { dealStage: { in: OPEN_DEAL_STAGES } },
          { deadlineAt: { eq: deal.deadlineAt } },
          { openDealKey: { is: 'NOT_NULL' } },
        ],
      },
      { ...data, closeDate: now.toISOString(), openDealKey: null },
    )
  ).length > 0;
