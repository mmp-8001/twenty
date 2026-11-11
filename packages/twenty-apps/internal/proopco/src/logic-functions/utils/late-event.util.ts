import {
  countRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

// An event that happened inside a deal that has since closed was applied against current state, not that deal.
export const happenedInClosedDeal = async (
  client: RecordsClient,
  personId: string,
  occurredAt: string,
): Promise<boolean> =>
  (await countRecords(client, 'opportunities', {
    and: [
      { pointOfContactId: { eq: personId } },
      { openDealKey: { is: 'NULL' } },
      { dealStage: { in: ['LOST', 'VOID'] } },
      { openedAt: { lte: occurredAt } },
      { deadlineAt: { gt: occurredAt } },
    ],
  })) > 0;
