import {
  countRecords,
  updateRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

export const recountOwnedContacts = async (
  client: RecordsClient,
  agentId: string,
): Promise<void> => {
  await updateRecord(client, 'Agent', agentId, {
    ownedContactCount: await countRecords(client, 'people', {
      and: [{ ownerId: { eq: agentId } }, { deletedAt: { is: 'NULL' } }],
    }),
  });
};
