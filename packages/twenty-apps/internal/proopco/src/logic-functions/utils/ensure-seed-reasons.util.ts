import { SEED_REASONS } from 'src/constants/seed-reasons.constant';
import {
  countRecords,
  createRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

// Only into an empty Reason list, so a Full Admin's edits are never undone by an upgrade.
export const ensureSeedReasons = async (client: RecordsClient): Promise<void> => {
  if ((await countRecords(client, 'reasons', {})) > 0) {
    return;
  }

  for (const reason of SEED_REASONS) {
    await createRecord(client, 'Reason', { ...reason, isActive: true });
  }
};
