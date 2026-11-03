import { MILLISECONDS_PER_DAY } from 'src/constants/proopco-jobs.constant';
import {
  listRecords,
  updateRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/list-records.util';

export const moveFollowupToRetry = async ({
  client,
  tradingAccountProopcoId,
  retryWindowDays,
  now,
}: {
  client: RecordsClient;
  tradingAccountProopcoId: string;
  retryWindowDays: number;
  now: Date;
}): Promise<boolean> => {
  const [account] = await listRecords<{ traderId: string | null }>(
    client,
    'tradingAccounts',
    { proopcoId: { eq: tradingAccountProopcoId } },
    { traderId: true },
  );

  if (!account?.traderId) {
    return false;
  }

  const followups = await listRecords<{ stage: string }>(
    client,
    'followups',
    { traderId: { eq: account.traderId } },
    { stage: true },
  );

  // A Trader already being worked again keeps that Followup, not the old one.
  if (followups.some(({ stage }) => stage === 'PENDING' || stage === 'RETRY_PENDING')) {
    return false;
  }

  const succeeded = followups.find(({ stage }) => stage === 'SUCCEEDED') as
    | { id: string }
    | undefined;

  if (!succeeded) {
    return false;
  }

  await updateRecord(client, 'Followup', succeeded.id, {
    stage: 'RETRY_PENDING',
    retryExpiresAt: new Date(
      now.getTime() + retryWindowDays * MILLISECONDS_PER_DAY,
    ).toISOString(),
  });

  return true;
};
