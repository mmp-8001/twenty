import { isDefined } from 'twenty-sdk/utils';

import { SWEEPER_BATCH_SIZE } from 'src/constants/platform-events.constant';
import { DAY_MS } from 'src/constants/time.constant';
import {
  clockOfDeal,
  loadOpenDealsByPerson,
  progressMirrorFields,
} from 'src/logic-functions/utils/deal.util';
import {
  recomputeContactEligibility,
  type EligibilityPlan,
} from 'src/logic-functions/utils/eligibility.util';
import {
  loadFrozenAgentIds,
  notOwnedBy,
} from 'src/logic-functions/utils/load-settings.util';
import {
  listRecords,
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { slotWindowsOf } from 'src/utils/deal-clock.util';

const SLOT_NUMBERS = [2, 3, 4, 5];

const withinDays = (now: Date, days: number) =>
  new Date(now.getTime() - days * DAY_MS).toISOString();

// Step 2: a slot window that ended with no answered call becomes Missed.
export const markMissedSlots = async (
  client: RecordsClient,
  now: Date,
): Promise<number> => {
  const slotFields = SLOT_NUMBERS.map((slot) => `slot${slot}Status`);
  // Windows end at anchor + 4, 8, 16 days (anchor >= first answered call) and slot 5 at the deadline.
  const deals = await listRecords<{
    id: string;
    firstAnsweredCallAt: string;
    frozenMs: number | null;
    deadlineAt: string;
    openedAt: string;
    dealStage: string;
    [slotField: string]: unknown;
  }>(
    client,
    'opportunities',
    {
      and: [
        { openDealKey: { is: 'NOT_NULL' } },
        { firstAnsweredCallAt: { is: 'NOT_NULL' } },
        ...notOwnedBy('agentId', await loadFrozenAgentIds(client)),
        {
          or: [
            { and: [{ slot2Status: { eq: 'PENDING' } }, { firstAnsweredCallAt: { lt: withinDays(now, 4) } }] },
            { and: [{ slot3Status: { eq: 'PENDING' } }, { firstAnsweredCallAt: { lt: withinDays(now, 8) } }] },
            { and: [{ slot4Status: { eq: 'PENDING' } }, { firstAnsweredCallAt: { lt: withinDays(now, 16) } }] },
            { and: [{ slot5Status: { eq: 'PENDING' } }, { deadlineAt: { lt: now.toISOString() } }] },
          ],
        },
      ],
    },
    {
      firstAnsweredCallAt: true,
      frozenMs: true,
      deadlineAt: true,
      openedAt: true,
      dealStage: true,
      ...Object.fromEntries(slotFields.map((name) => [name, true])),
    },
    SWEEPER_BATCH_SIZE,
  );
  let marked = 0;

  for (const deal of deals) {
    const clock = clockOfDeal({
      ...deal,
      dealType: 'CAMPAIGN',
      sourceCampaignId: null,
      frozenMs: deal.frozenMs ?? 0,
    });

    for (const { slot, endsAt } of slotWindowsOf(clock)) {
      if (endsAt > now || clock.slots[slot - 1] !== 'PENDING') {
        continue;
      }

      const written = await updateRecordsWhere(
        client,
        'Opportunities',
        {
          and: [
            { id: { eq: deal.id } },
            { openDealKey: { is: 'NOT_NULL' } },
            { [`slot${slot}Status`]: { eq: 'PENDING' } },
          ],
        },
        { [`slot${slot}Status`]: 'MISSED' },
      );

      marked += written.length;
    }
  }

  return marked;
};

// Step 3: Cool-down contacts past their time go back to Free and are matched to campaigns again.
export const releaseCooldowns = async (
  client: RecordsClient,
  plan: EligibilityPlan,
  now: Date,
): Promise<number> => {
  const due = await listRecords<{ id: string }>(
    client,
    'people',
    {
      and: [
        { lifecycleStage: { eq: 'COOL_DOWN' } },
        { cooldownUntil: { lte: now.toISOString() } },
        { deletedAt: { is: 'NULL' } },
      ],
    },
    {},
    SWEEPER_BATCH_SIZE,
  );
  let released = 0;

  for (const { id } of due) {
    const written = await updateRecordsWhere(
      client,
      'People',
      {
        and: [
          { id: { eq: id } },
          { lifecycleStage: { eq: 'COOL_DOWN' } },
          { cooldownUntil: { lte: now.toISOString() } },
        ],
      },
      { lifecycleStage: 'FREE', cooldownUntil: null },
    );

    if (written.length > 0) {
      released += 1;
      await recomputeContactEligibility(client, plan, id);
    }
  }

  return released;
};

type MirroredPerson = {
  id: string;
  lifecycleStage: string;
  nextCallAt: string | null;
  callUrgency: string | null;
  planProgress: string | null;
};

const matches = (field: string, value: string | null) =>
  value === null ? { [field]: { is: 'NULL' } } : { [field]: { eq: value } };

const PAGE = 200;

// Step 4: rewrite urgency and progress on rows that crossed a boundary.
// shortcut: scans every owned contact each tick, add a "next boundary" column if owned contacts pass a few thousand.
export const refreshDealMirrors = async (
  client: RecordsClient,
  now: Date,
): Promise<number> => {
  const people = await listRecords<MirroredPerson>(
    client,
    'people',
    {
      and: [
        { ownerId: { is: 'NOT_NULL' } },
        { deletedAt: { is: 'NULL' } },
        { lifecycleStage: { in: ['AWAITING_FIRST_CALL', 'IN_FOLLOW_UP', 'CUSTOMER', 'REBUY_WINDOW'] } },
        ...notOwnedBy('ownerId', await loadFrozenAgentIds(client)),
      ],
    },
    { lifecycleStage: true, nextCallAt: true, callUrgency: true, planProgress: true },
  );
  let rewritten = 0;

  for (let start = 0; start < people.length; start += PAGE) {
    const page = people.slice(start, start + PAGE);
    const deals = await loadOpenDealsByPerson(
      client,
      page.map(({ id }) => id),
    );

    for (const person of page) {
      const deal = deals.get(person.id);
      const wanted = progressMirrorFields({
        clock: isDefined(deal) && deal.dealStage !== 'REBUY_WINDOW' ? clockOfDeal(deal) : null,
        rebuyWindowDeadlineAt:
          deal?.dealStage === 'REBUY_WINDOW' ? new Date(deal.deadlineAt) : null,
        nextCallAt: isDefined(person.nextCallAt) ? new Date(person.nextCallAt) : null,
        now,
      });

      if (wanted.callUrgency === person.callUrgency && wanted.planProgress === person.planProgress) {
        continue;
      }

      const written = await updateRecordsWhere(
        client,
        'People',
        { and: [{ id: { eq: person.id } }, matches('nextCallAt', person.nextCallAt), { lifecycleStage: { eq: person.lifecycleStage } }] },
        wanted,
      );

      rewritten += written.length;
    }
  }

  return rewritten;
};
