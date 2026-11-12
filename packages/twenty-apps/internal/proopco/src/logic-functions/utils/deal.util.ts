import { isDefined } from 'twenty-sdk/utils';

import {
  urgencyOf,
  planProgressOf,
  rebuyWindowProgressOf,
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

export const loadOpenDealsByPerson = async (
  client: RecordsClient,
  personIds: string[],
): Promise<Map<string, DealRow>> => {
  const deals = await listRecords<DealRow & { openDealKey: string }>(
    client,
    'opportunities',
    { openDealKey: { in: personIds } },
    { ...DEAL_SELECTION, openDealKey: true },
  );

  return new Map(deals.map((deal) => [deal.openDealKey, deal]));
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

type ProgressInput = {
  clock: DealClock | null;
  rebuyWindowDeadlineAt?: Date | null;
  nextCallAt: Date | null;
  now: Date;
};

// The two mirrors that drift with time; the sweeper rewrites only these.
export const progressMirrorFields = ({
  clock,
  rebuyWindowDeadlineAt,
  nextCallAt,
  now,
}: ProgressInput) => ({
  callUrgency: urgencyOf(nextCallAt, now),
  planProgress: isDefined(rebuyWindowDeadlineAt)
    ? rebuyWindowProgressOf(rebuyWindowDeadlineAt, now)
    : clock === null
      ? null
      : planProgressOf(clock, now),
});

const DEAL_TYPE_LABELS = { Campaign: 'کمپین', Rebuy: 'خرید مجدد', Retention: 'نگهداشت' } as const;

type MirrorInput = ProgressInput & {
  dealTypeLabel: 'Campaign' | 'Rebuy' | 'Retention' | null;
  sourceCampaignId?: string | null;
};

// Views cannot show related fields, so every clock or next-call change rewrites these on the Person.
export const personMirrorFields = ({
  clock,
  dealTypeLabel,
  sourceCampaignId,
  nextCallAt,
  rebuyWindowDeadlineAt,
  now,
}: MirrorInput) => ({
  nextCallAt: nextCallAt?.toISOString() ?? null,
  dealTypeLabel: dealTypeLabel === null ? null : DEAL_TYPE_LABELS[dealTypeLabel],
  ...(sourceCampaignId === undefined ? {} : { sourceCampaignId }),
  deadlineAt: (rebuyWindowDeadlineAt ?? clock?.deadlineAt)?.toISOString() ?? null,
  ...progressMirrorFields({ clock, rebuyWindowDeadlineAt, nextCallAt, now }),
});
