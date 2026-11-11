import { isDefined } from 'twenty-sdk/utils';

import {
  urgencyOf,
  planProgressOf,
  type DealClock,
  type SlotStatus,
} from 'src/utils/deal-clock.util';
import {
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

export const OPEN_DEAL_STAGES = ['AWAITING_FIRST_CALL', 'IN_FOLLOW_UP', 'REBUY_WINDOW'];

const SLOT_FIELD_NAMES = [1, 2, 3, 4, 5].map((slot) => `slot${slot}Status`);

export type DealRow = {
  id: string;
  dealType: 'CAMPAIGN' | 'REBUY';
  dealStage: string;
  openedAt: string;
  firstAnsweredCallAt: string | null;
  deadlineAt: string;
  frozenMs: number;
  sourceCampaignId: string | null;
  [slotField: string]: unknown;
};

const DEAL_SELECTION = {
  dealType: true,
  dealStage: true,
  openedAt: true,
  firstAnsweredCallAt: true,
  deadlineAt: true,
  frozenMs: true,
  sourceCampaignId: true,
  ...Object.fromEntries(SLOT_FIELD_NAMES.map((name) => [name, true])),
};

// The unique openDealKey holds the person id only while the deal is open.
export const loadOpenDeal = async (
  client: RecordsClient,
  personId: string,
): Promise<DealRow | null> => {
  const [deal] = await listRecords<DealRow>(
    client,
    'opportunities',
    { openDealKey: { eq: personId } },
    DEAL_SELECTION,
    1,
  );

  return deal ?? null;
};

export const clockOfDeal = (deal: DealRow): DealClock => ({
  stage: deal.dealStage === 'AWAITING_FIRST_CALL' ? 'AWAITING_FIRST_CALL' : 'IN_FOLLOW_UP',
  openedAt: new Date(deal.openedAt),
  firstAnsweredCallAt: isDefined(deal.firstAnsweredCallAt)
    ? new Date(deal.firstAnsweredCallAt)
    : null,
  frozenMs: deal.frozenMs ?? 0,
  deadlineAt: new Date(deal.deadlineAt),
  slots: SLOT_FIELD_NAMES.map((name) => (deal[name] as SlotStatus | null) ?? 'PENDING'),
});

export const dealClockFields = (clock: DealClock, currentSlot: number | null) => ({
  dealStage: clock.stage,
  firstAnsweredCallAt: clock.firstAnsweredCallAt?.toISOString() ?? null,
  deadlineAt: clock.deadlineAt.toISOString(),
  ...Object.fromEntries(SLOT_FIELD_NAMES.map((name, index) => [name, clock.slots[index]])),
  ...(isDefined(currentSlot) ? { currentSlot } : {}),
});

type MirrorInput = {
  clock: DealClock | null;
  dealTypeLabel: 'Campaign' | 'Rebuy' | 'Retention';
  sourceCampaignId?: string | null;
  nextCallAt: Date | null;
  now: Date;
};

// Views cannot show related fields, so every clock or next-call change rewrites these on the Person.
export const personMirrorFields = ({
  clock,
  dealTypeLabel,
  sourceCampaignId,
  nextCallAt,
  now,
}: MirrorInput) => ({
  nextCallAt: nextCallAt?.toISOString() ?? null,
  dealTypeLabel,
  ...(sourceCampaignId === undefined ? {} : { sourceCampaignId }),
  deadlineAt: clock?.deadlineAt.toISOString() ?? null,
  callUrgency: urgencyOf(nextCallAt, now),
  planProgress: clock === null ? null : planProgressOf(clock, now),
});
