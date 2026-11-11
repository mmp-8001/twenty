import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { SWEEPER_BATCH_SIZE } from 'src/constants/platform-events.constant';
import {
  loadEligibilityPlan,
  recomputeContactEligibility,
} from 'src/logic-functions/utils/eligibility.util';
import { recountOwnedContacts } from 'src/logic-functions/utils/recount-owned-contacts.util';
import {
  listRecords,
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

// A claim that died between taking the contact and creating its deal; the grace keeps a claim still in flight safe.
const CLAIM_GRACE_MS = 2 * 60 * 1000;

// shortcut: no In progress Audit row check, the Audit log lands in #92; add it there so a transfer in flight is never released.
export const reconcileClaims = async (
  client: RecordsClient,
  now: Date,
): Promise<number> => {
  const stale = await listRecords<{ id: string; ownerId: string }>(
    client,
    'people',
    {
      and: [
        { ownerId: { is: 'NOT_NULL' } },
        { deletedAt: { is: 'NULL' } },
        { lifecycleStage: { eq: 'AWAITING_FIRST_CALL' } },
        { ownedSince: { lt: new Date(now.getTime() - CLAIM_GRACE_MS).toISOString() } },
      ],
    },
    { ownerId: true },
    SWEEPER_BATCH_SIZE,
  );

  if (stale.length === 0) {
    return 0;
  }

  const openDeals = await listRecords<{ openDealKey: string }>(
    client,
    'opportunities',
    { openDealKey: { in: stale.map(({ id }) => id) } },
    { openDealKey: true },
  );
  const withDeal = new Set(openDeals.map(({ openDealKey }) => openDealKey));
  const orphans = stale.filter(({ id }) => !withDeal.has(id));

  if (orphans.length === 0) {
    return 0;
  }

  const plan = await loadEligibilityPlan(client, new MetadataApiClient({ runAs: 'application' }));
  let released = 0;

  for (const { id, ownerId } of orphans) {
    const written = await updateRecordsWhere(
      client,
      'People',
      { and: [{ id: { eq: id } }, { ownerId: { eq: ownerId } }, { lifecycleStage: { eq: 'AWAITING_FIRST_CALL' } }] },
      { ownerId: null, ownerMemberId: null, lifecycleStage: 'FREE', ownedSince: null, sourceCampaignId: null },
    );

    if (written.length > 0) {
      released += 1;
      await recomputeContactEligibility(client, plan, id);
      await recountOwnedContacts(client, ownerId);
    }
  }

  return released;
};
