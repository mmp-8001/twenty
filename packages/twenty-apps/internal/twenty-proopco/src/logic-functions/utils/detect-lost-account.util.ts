import { ACTIVE_ACCOUNT_STATUS } from 'src/constants/ownership.constant';
import {
  createRecord,
  listRecords,
  type RecordsClient,
  updateRecord,
} from 'src/logic-functions/utils/list-records.util';
import { readRebuySettings } from 'src/logic-functions/utils/rebuy-settings.util';

const HOUR_MS = 60 * 60 * 1000;

export const isActiveAccountStatus = (status: string | null | undefined) =>
  status?.trim().toLowerCase() === ACTIVE_ACCOUNT_STATUS;

// RB-01: a successful User whose active accounts drop to zero goes to their admin's Rebuy list.
// Runs after every Account sync item; once the Ownership leaves SUCCESSFUL it does nothing.
export const detectLostLastAccount = async ({
  client,
  accountProopcoId,
  now = new Date(),
}: {
  client: RecordsClient;
  accountProopcoId: string;
  now?: Date;
}): Promise<void> => {
  const [account] = await listRecords<{ status: string | null; personId: string | null }>(
    client,
    'challengeAccounts',
    { proopcoId: { eq: accountProopcoId } },
    { status: true, personId: true },
  );

  if (!account?.personId || isActiveAccountStatus(account.status)) {
    return;
  }

  const personId = account.personId;
  const [ownership] = await listRecords<{ id: string; state: string | null; adminId: string | null }>(
    client,
    'ownerships',
    { openUserKey: { eq: personId } },
    { state: true, adminId: true },
  );

  if (ownership?.state !== 'SUCCESSFUL') {
    return;
  }

  const accounts = await listRecords<{ status: string | null }>(
    client,
    'challengeAccounts',
    { personId: { eq: personId } },
    { status: true },
  );

  if (accounts.some(({ status }) => isActiveAccountStatus(status))) {
    return;
  }

  const [openFollowup] = await listRecords<{ status: string | null }>(
    client,
    'followups',
    { openKey: { eq: personId } },
    { status: true },
  );

  if (!openFollowup) {
    try {
      await createRecord(client, 'Followup', {
        personId,
        adminId: ownership.adminId,
        ownershipId: ownership.id,
        campaignId: null,
        kind: 'REBUY',
        status: 'REBUY_PENDING',
        addedAt: now.toISOString(),
        deadlineAt: new Date(now.getTime() + readRebuySettings().startHours * HOUR_MS).toISOString(),
        openKey: personId,
      });
    } catch (error) {
      // The unique open key means a concurrent sync created the case.
      const [created] = await listRecords<{ status: string | null }>(
        client,
        'followups',
        { openKey: { eq: personId } },
        { status: true },
      );

      if (!created) {
        throw error;
      }
    }
  } else if (openFollowup.status !== 'REBUY_PENDING') {
    return;
  }

  await updateRecord(client, 'Ownership', ownership.id, { state: 'REBUY_PENDING' });
};
