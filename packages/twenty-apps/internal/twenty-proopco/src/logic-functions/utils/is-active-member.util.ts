import { listRecords, type RecordsClient } from 'src/logic-functions/utils/list-records.util';

export const INACTIVE_ADMIN_MESSAGE = 'Your account is frozen or deactivated';

// A member with no crmStatus yet counts as active.
export const isActiveMember = async (client: RecordsClient, memberId: string): Promise<boolean> => {
  const [member] = await listRecords<{ crmStatus: string | null }>(
    client,
    'workspaceMembers',
    { id: { eq: memberId } },
    { crmStatus: true },
  );

  return (member?.crmStatus ?? 'ACTIVE') === 'ACTIVE';
};
