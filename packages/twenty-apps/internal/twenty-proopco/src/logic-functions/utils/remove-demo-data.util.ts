import { DEMO_PROOPCO_ID_PREFIX } from 'src/constants/demo-data.constant';
import { listRecords, readIds, type RecordsClient } from 'src/logic-functions/utils/list-records.util';
import { isDemoKey } from 'src/utils/demo-data.util';

const likeDemo = { like: `${DEMO_PROOPCO_ID_PREFIX}%` };

// The server filter narrows the read; isDemoKey is the exact rule for what counts as demo.
const readDemoIds = async (client: RecordsClient, collection: string, keyField: string) =>
  (await listRecords<{ id: string } & Record<string, string | null>>(client, collection, { [keyField]: likeDemo }, { [keyField]: true }))
    .filter((record) => isDemoKey(record[keyField]))
    .map(({ id }) => id);

const destroyAll = async (client: RecordsClient, singular: string, ids: string[]) => {
  for (const id of ids) {
    await client.mutation({ [`destroy${singular}`]: { __args: { id }, id: true } });
  }

  return ids.length;
};

// Only records reached from a demo key are destroyed: demo users and what hangs off them, demo-keyed
// incomes and offers. Audit Log rows are append-only and stay. Children go before parents.
export const removeDemoData = async ({ client }: { client: RecordsClient }): Promise<{ removed: number }> => {
  const personIds = await readDemoIds(client, 'people', 'proopcoId');
  const inPeople = personIds.length > 0 ? { personId: { in: personIds } } : null;
  const byPerson = (collection: string) => (inPeople ? readIds(client, collection, inPeople) : Promise.resolve([]));
  const followupIds = await byPerson('followups');
  const touchIds = followupIds.length > 0 ? await readIds(client, 'touches', { followupId: { in: followupIds } }) : [];
  let removed = 0;

  removed += await destroyAll(client, 'Commission', [
    ...new Set([...(await byPerson('commissions')), ...(await readDemoIds(client, 'commissions', 'accountKey'))]),
  ]);
  removed += await destroyAll(client, 'MonthlyIncome', await readDemoIds(client, 'monthlyIncomes', 'incomeKey'));
  removed += await destroyAll(client, 'OfferActivation', await byPerson('offerActivations'));
  // The demo activations are gone by now, so any activation left on a demo-titled Offer is a real user's.
  const demoOfferIds = await readDemoIds(client, 'offers', 'title');
  const realActivations =
    demoOfferIds.length > 0
      ? await listRecords<{ offerId: string | null }>(
          client,
          'offerActivations',
          { offerId: { in: demoOfferIds } },
          { offerId: true },
        )
      : [];
  const keptOfferIds = new Set(realActivations.map(({ offerId }) => offerId));

  removed += await destroyAll(client, 'Offer', demoOfferIds.filter((id) => !keptOfferIds.has(id)));
  removed += await destroyAll(client, 'Touch', touchIds);
  removed += await destroyAll(client, 'Call', await byPerson('calls'));
  removed += await destroyAll(client, 'Followup', followupIds);
  removed += await destroyAll(client, 'Ownership', await byPerson('ownerships'));
  removed += await destroyAll(client, 'Payment', await readDemoIds(client, 'payments', 'proopcoId'));
  removed += await destroyAll(client, 'ChallengeAccount', await readDemoIds(client, 'challengeAccounts', 'proopcoId'));

  removed += await destroyAll(client, 'Person', personIds);

  return { removed };
};
