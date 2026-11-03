import {
  computeFollowupSweepUpdate,
  type SweepFollowup,
} from 'src/logic-functions/utils/compute-followup-sweep-update.util';
import {
  listRecords,
  updateRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/list-records.util';

export const sweepFollowups = async ({
  client,
  referenceDate,
  poolDays,
}: {
  client: RecordsClient;
  referenceDate: Date;
  poolDays: number;
}): Promise<{ updated: number }> => {
  const followups = await listRecords<SweepFollowup & { id: string }>(
    client,
    'followups',
    { stage: { in: ['PENDING', 'RETRY_PENDING'] } },
    { stage: true, ownerId: true, expiresAt: true, retryExpiresAt: true },
  );
  let updated = 0;

  for (const followup of followups) {
    const update = computeFollowupSweepUpdate({
      followup,
      referenceDate,
      poolDays,
    });

    if (update) {
      await updateRecord(client, 'Followup', followup.id, update);
      updated += 1;
    }
  }

  return { updated };
};
