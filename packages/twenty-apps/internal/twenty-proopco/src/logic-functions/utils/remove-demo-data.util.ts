import { DEMO_PROOPCO_ID_PREFIX } from 'src/constants/demo-data.constant';
import {
  listRecords,
  type RecordsClient,
  updateRecord,
} from 'src/logic-functions/utils/list-records.util';

const likeDemo = { like: `${DEMO_PROOPCO_ID_PREFIX}%` };

const readIds = async (client: RecordsClient, collection: string, filter: Record<string, unknown>) =>
  (await listRecords<{ id: string }>(client, collection, filter, {})).map(({ id }) => id);

const destroyAll = async (client: RecordsClient, singular: string, ids: string[]) => {
  for (const id of ids) {
    await client.mutation({ [`destroy${singular}`]: { __args: { id }, id: true } });
  }

  return ids.length;
};

// Only records reached from a demo key are destroyed: demo users and what hangs off them, demo-keyed
// incomes, offers and freezes. Audit Log rows are append-only and stay. Children go before parents.
export const removeDemoData = async ({ client }: { client: RecordsClient }): Promise<{ removed: number }> => {
  const personIds = await readIds(client, 'people', { proopcoId: likeDemo });
  const inPeople = personIds.length > 0 ? { personId: { in: personIds } } : null;
  const byPerson = (collection: string) => (inPeople ? readIds(client, collection, inPeople) : Promise.resolve([]));
  const followupIds = await byPerson('followups');
  const touchIds = followupIds.length > 0 ? await readIds(client, 'touches', { followupId: { in: followupIds } }) : [];
  const freezes = await listRecords<{ id: string; adminId: string | null; unfrozenAt: string | null }>(
    client,
    'adminFreezes',
    { reason: likeDemo },
    { adminId: true, unfrozenAt: true },
  );
  let removed = 0;

  removed += await destroyAll(client, 'Commission', [
    ...new Set([...(await byPerson('commissions')), ...(await readIds(client, 'commissions', { accountKey: likeDemo }))]),
  ]);
  removed += await destroyAll(client, 'MonthlyIncome', await readIds(client, 'monthlyIncomes', { incomeKey: likeDemo }));
  removed += await destroyAll(client, 'OfferActivation', await byPerson('offerActivations'));
  removed += await destroyAll(client, 'Offer', await readIds(client, 'offers', { title: likeDemo }));
  removed += await destroyAll(client, 'Touch', touchIds);
  removed += await destroyAll(client, 'Call', await byPerson('calls'));
  removed += await destroyAll(client, 'Followup', followupIds);
  removed += await destroyAll(client, 'Ownership', await byPerson('ownerships'));
  removed += await destroyAll(client, 'Payment', await readIds(client, 'payments', { proopcoId: likeDemo }));
  removed += await destroyAll(client, 'ChallengeAccount', await readIds(client, 'challengeAccounts', { proopcoId: likeDemo }));

  // The freeze changed a real member, so removal gives the member back.
  for (const { adminId, unfrozenAt } of freezes) {
    if (adminId && !unfrozenAt) {
      await updateRecord(client, 'WorkspaceMember', adminId, { crmStatus: 'ACTIVE', frozenSince: null });
    }
  }

  removed += await destroyAll(client, 'AdminFreeze', freezes.map(({ id }) => id));
  removed += await destroyAll(client, 'Person', personIds);

  return { removed };
};
